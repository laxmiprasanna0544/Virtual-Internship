/**
 * Shared harness for the integration suites in scripts/tests.
 *
 * They run against a real build of the app and the local stand-ins:
 *
 *   npm run local:up && npm run local:setup # Postgres, S3 emulator, Cashfree mock
 *   npm run build && npm run start:standalone
 *   npm run test:all                        # or any single test:<suite>
 *
 * Every HTTP call goes through the real routes, middleware and cookies, the
 * way a browser makes it. The database connection is only used to assert on
 * what was stored and to promote test accounts to staff roles.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import postgres from "postgres";

const ROOT = new URL("../..", import.meta.url).pathname;

export const env = Object.fromEntries(
  readFileSync(`${ROOT}.env.local`, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

export const BASE = process.env.BASE_URL ?? env.NEXT_PUBLIC_SITE_URL;
export const SITE_ORIGIN = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
export const S3 = env.S3_ENDPOINT;
export const OUTBOX = env.EMAIL_OUTBOX_DIR;
export const CASHFREE = new URL(env.CASHFREE_API_BASE).origin;

for (const url of [BASE, env.DATABASE_URL, S3, CASHFREE]) {
  if (!/(localhost|127\.0\.0\.1)/.test(url)) {
    console.error(`Refusing to run: ${url} is not local.`);
    process.exit(1);
  }
}

export const sql = postgres(env.DATABASE_URL, { max: 2, onnotice: () => {} });

/* ------------------------------------------------------------------ */
/*  Results                                                            */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;
let skipped = 0;

export function section(title) {
  console.log(`\n## ${title}`);
}

export function check(label, condition, detail) {
  if (condition) passed += 1;
  else failed += 1;
  const extra = !condition && detail !== undefined ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : "";
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${extra}`);
  return Boolean(condition);
}

/** A check that cannot be exercised against the local emulator; reported, never counted as a pass. */
export function skip(label, reason) {
  skipped += 1;
  console.log(`SKIP  ${label} — ${reason}`);
}


export async function finish(name) {
  await sql.end({ timeout: 5 });
  console.log(`\n${name}: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed ? 1 : 0);
}

/* ------------------------------------------------------------------ */
/*  HTTP client with a cookie jar                                      */
/* ------------------------------------------------------------------ */

let ipCounter = 0;

export class Client {
  constructor(label = "client") {
    this.label = label;
    this.cookies = new Map();
    // A distinct client address per actor, as the platform edge would send, so
    // per-IP rate limits don't leak between independent test actors.
    ipCounter += 1;
    this.ip = `10.${randomBytes(1)[0]}.${randomBytes(1)[0]}.${(ipCounter % 250) + 1}`;
  }

  cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  rawCookie(name) {
    return this.cookies.get(name);
  }

  async request(method, path, body, { headers = {}, origin = SITE_ORIGIN, redirect = "manual" } = {}) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      redirect,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(origin ? { Origin: origin } : {}),
        // As DigitalOcean's edge would set it (CLIENT_IP_HEADER=do-connecting-ip).
        "do-connecting-ip": this.ip,
        Cookie: this.cookieHeader(),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    this.setCookies = res.headers.getSetCookie();
    for (const cookie of this.setCookies) {
      const [pair, ...attrs] = cookie.split(";");
      const name = pair.slice(0, pair.indexOf("="));
      const value = pair.slice(pair.indexOf("=") + 1);
      const maxAge = attrs.find((a) => /max-age/i.test(a));
      if (value === "" || (maxAge && /=\s*0$/.test(maxAge))) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return { status: res.status, json, text, headers: res.headers };
  }

  get(path, opts) {
    return this.request("GET", path, undefined, opts);
  }

  post(path, body = {}, opts) {
    return this.request("POST", path, body, opts);
  }
}

/* ------------------------------------------------------------------ */
/*  Accounts                                                           */
/* ------------------------------------------------------------------ */

export const PASSWORD = "Str0ngPassword1";

export function uniqueEmail(prefix = "student") {
  return `${prefix}.${Date.now()}.${randomBytes(3).toString("hex")}@test.roystian.local`;
}

/* Emails are written to .local/outbox by the app (EMAIL_OUTBOX_DIR). */

/** Every email the app has "sent", oldest first. */
export function sentEmails() {
  if (!OUTBOX) return [];
  let files = [];
  try {
    files = readdirSync(OUTBOX).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  return files.map((f) => JSON.parse(readFileSync(`${OUTBOX}/${f}`, "utf8")));
}

/** The 6-digit code in the newest email to `to` whose subject matches. */
export async function latestCode(to, subject = /code|reset|confirm/i) {
  const found = await waitFor(() => {
    const mail = sentEmails().filter((m) => m.to === to.toLowerCase() && subject.test(m.subject)).pop();
    return mail ? /\b(\d{6})\b/.exec(mail.text)?.[1] : null;
  }, { timeout: 5000, interval: 100 });
  if (!found) throw new Error(`no code emailed to ${to}`);
  return found;
}

/* RFC 6238 TOTP, as an authenticator app computes it. */
function base32Decode(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
export function totp(secret, step = Math.floor(Date.now() / 30000)) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const d = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const o = d[d.length - 1] & 15;
  return String((d.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/**
 * A fresh authenticator code for this client. A code can't be reused inside
 * its window, so this uses the next unused step (the server accepts one step
 * of clock drift) and waits for the clock when both are used.
 */
export async function nextTotp(client) {
  for (;;) {
    const now = Math.floor(Date.now() / 30000);
    const step = Math.max(now, (client.lastTotpStep ?? -1) + 1);
    if (step <= now + 1) {
      client.lastTotpStep = step;
      return totp(client.totpSecret, step);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

/**
 * Signs up through the API, confirms with the emailed code and signs in.
 * Returns the profile id.
 */
export async function newStudent(client, overrides = {}) {
  const email = overrides.email ?? uniqueEmail(overrides.prefix ?? "student");
  const signup = await client.post("/api/auth/signup", {
    name: overrides.name ?? "Test Student",
    email,
    password: PASSWORD,
    mobile: overrides.mobile ?? "9876543210",
    college: overrides.college ?? "Vignan Institute of Technology",
    course: "B.Tech",
    city: "Hyderabad",
    educationLevel: "undergraduate",
  });
  if (signup.status !== 200) throw new Error(`signup ${signup.status}: ${signup.text}`);
  const confirm = await client.post("/api/auth/confirm", { email, code: await latestCode(email, /verification/i) });
  if (confirm.status !== 200) throw new Error(`confirm ${confirm.status}: ${confirm.text}`);
  const login = await client.post("/api/auth/login", { email, password: PASSWORD });
  if (login.status !== 200) throw new Error(`login ${login.status}: ${login.text}`);
  client.email = email;
  return { email, id: login.json.user.id, user: login.json.user };
}

/**
 * A fresh staff account: signs up as a student, is promoted in SQL (as an
 * administrator would), enrols an authenticator app, and signs in with MFA.
 */
export async function newStaff(client, role, { trainerDomains, collegeId, mfa = true } = {}) {
  const { email, id } = await newStudent(client, { prefix: role, name: `Test ${role}` });
  await sql.begin(async (tx) => {
    await tx`delete from public.students where id = ${id}`;
    await tx`update public.profiles set role = ${role}, college_id = ${collegeId ?? null} where id = ${id}`;
    if (role === "trainer") {
      await tx`
        insert into public.trainers (id, profile_id, name, domains)
        values (${`trainer-${id}`}, ${id}, 'Test trainer', ${trainerDomains ?? ["ai-ml"]})`;
    }
  });
  if (mfa) await enrolMfa(client);
  return { email, id };
}

/** Enrols an authenticator app with a real TOTP code computed from the secret. */
export async function enrolMfa(client) {
  const setup = await client.post("/api/auth/mfa/setup", {});
  if (setup.status !== 200) throw new Error(`mfa setup ${setup.status}: ${setup.text}`);
  client.totpSecret = setup.json.secret;
  client.lastTotpStep = undefined;
  const enable = await client.post("/api/auth/mfa/enable", { code: await nextTotp(client) });
  if (enable.status !== 200) throw new Error(`mfa enable ${enable.status}: ${enable.text}`);
  return setup.json;
}

/** Signs in an account that has MFA enabled. */
export async function loginWithMfa(client, email) {
  const first = await client.post("/api/auth/login", { email, password: PASSWORD });
  if (!first.json?.mfaRequired) return first;
  return client.post("/api/auth/mfa", { code: await nextTotp(client) });
}

/* ------------------------------------------------------------------ */
/*  Payments                                                           */
/* ------------------------------------------------------------------ */

/** Pays an order on the Cashfree mock, which sends the signed webhook. */
export async function payOnGateway(orderId, { fail = false } = {}) {
  const res = await fetch(`${CASHFREE}/__test/pay/${encodeURIComponent(orderId)}${fail ? "?fail=1" : ""}`, {
    method: "POST",
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

export async function waitFor(fn, { timeout = 15_000, interval = 300 } = {}) {
  const until = Date.now() + timeout;
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() > until) return value;
    await new Promise((r) => setTimeout(r, interval));
  }
}

/** Full enrolment through checkout → gateway → webhook. Returns the registration id. */
export async function enrol(client, domainId = "ai-ml", programId = "industry-led", experience = "beginner") {
  const order = await client.post("/api/payment/create-order", { domainId, programId, experience });
  if (order.status !== 200) throw new Error(`create-order ${order.status}: ${order.text}`);
  const paid = await payOnGateway(order.json.orderId);
  if (paid.status !== 200) throw new Error(`gateway pay ${paid.status}: ${JSON.stringify(paid.json)}`);
  const verified = await waitFor(async () => {
    const res = await client.get(`/api/payment/verify?orderId=${encodeURIComponent(order.json.orderId)}`);
    return res.json?.status === "successful" ? res : null;
  });
  if (!verified) throw new Error("payment never confirmed");
  return { orderId: order.json.orderId, registrationId: verified.json.registrationId };
}

/* ------------------------------------------------------------------ */
/*  Curriculum answer keys (compiled from the app's own data/)          */
/* ------------------------------------------------------------------ */

let compiled = false;
export function curriculum() {
  if (!compiled) {
    execSync("npx tsc -p tsconfig.selftest.json", { cwd: ROOT, stdio: "inherit" });
    compiled = true;
  }
  const require = createRequire(import.meta.url);
  require(`${ROOT}.selftest-register.cjs`);
  const domains = require(`${ROOT}.selftest/data/domains.js`);
  const bank = require(`${ROOT}.selftest/data/assessment-bank.js`);
  const programs = require(`${ROOT}.selftest/data/programs.js`);
  const projects = require(`${ROOT}.selftest/data/projects.js`);
  const challenges = require(`${ROOT}.selftest/data/challenges.js`);
  return {
    getDomain: domains.getDomain,
    moduleAssessments: (domainId) => domains.getDomainAssessments(domainId).map((a) => bank.getAssessmentWithAnswers(a.id)),
    finalAssessment: (domainId) => bank.getAssessmentWithAnswers(`${domainId}-final`),
    getProgram: programs.getProgram,
    projects,
    challenges,
    correctAnswers: (assessment) => Object.fromEntries(assessment.questions.map((q) => [q.id, q.correct])),
    wrongAnswers: (assessment) =>
      Object.fromEntries(
        assessment.questions.map((q) => [q.id, [q.options.findIndex((_, i) => !q.correct.includes(i))]]),
      ),
  };
}
