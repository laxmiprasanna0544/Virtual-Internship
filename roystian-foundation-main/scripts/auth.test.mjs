/**
 * Auth flows that go through email, against a running dev server and the
 * LOCAL Supabase stack. Emails are read from Mailpit (the CLI's mail catcher).
 *
 *   npx supabase db reset && npm run dev
 *   npm run test:auth
 *
 * Covers: password reset end to end, the open-redirect guard on the email
 * callback, and server-side route protection for trainers.
 */
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!/127\.0\.0\.1|localhost/.test(SUPABASE_URL)) {
  console.error("Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not local.");
  process.exit(1);
}

let failures = 0;
function check(label, condition, detail) {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${!condition && detail !== undefined ? ` — ${detail}` : ""}`);
  if (!condition) failures += 1;
}

function session() {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const cookie = () => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  /** Applies Set-Cookie headers from our own server to the jar. */
  const absorb = (res) => {
    for (const header of res.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const name = pair.slice(0, pair.indexOf("="));
      const value = pair.slice(pair.indexOf("=") + 1);
      if (value) jar.set(name, value);
      else jar.delete(name);
    }
  };
  return { supabase, jar, cookie, absorb };
}

async function latestEmailTo(address) {
  for (let i = 0; i < 20; i += 1) {
    const list = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`).then((r) => r.json());
    const message = list.messages?.[0];
    if (message) return fetch(`${MAILPIT}/api/v1/message/${message.ID}`).then((r) => r.json());
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

// Password reset ------------------------------------------------------------
{
  const email = `reset-${Date.now()}@auth-test.example`;
  const signup = session();
  await signup.supabase.auth.signUp({ email, password: "original-pass-1" });

  const browser = session();
  const { error } = await browser.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE_URL}/auth/callback?next=/reset-password`,
  });
  check("reset email is requested", !error, error?.message);

  const message = await latestEmailTo(email);
  const link = message?.Text?.match(/https?:\/\/\S+/)?.[0]?.replace(/&amp;/g, "&");
  check("reset email arrives with a link", Boolean(link), message?.Text);

  // Supabase verifies the token and redirects to our callback with a code.
  const verify = await fetch(link, { redirect: "manual" });
  const callbackUrl = verify.headers.get("location");
  check(
    "link redirects to the app's auth callback",
    callbackUrl?.startsWith(`${BASE_URL}/auth/callback`) && callbackUrl.includes("code="),
    callbackUrl,
  );

  const callback = await fetch(callbackUrl, { redirect: "manual", headers: { cookie: browser.cookie() } });
  browser.absorb(callback);
  check(
    "callback exchanges the code and continues to /reset-password",
    callback.status === 307 && new URL(callback.headers.get("location")).pathname === "/reset-password",
    `${callback.status} ${callback.headers.get("location")}`,
  );

  const { data: user } = await browser.supabase.auth.getUser();
  check("the recovery session is signed in", user.user?.email === email);

  const update = await browser.supabase.auth.updateUser({ password: "brand-new-pass-2" });
  check("new password is saved", !update.error, update.error?.message);

  const oldLogin = await session().supabase.auth.signInWithPassword({ email, password: "original-pass-1" });
  const newLogin = await session().supabase.auth.signInWithPassword({ email, password: "brand-new-pass-2" });
  check("old password no longer works", Boolean(oldLogin.error));
  check("new password works", !newLogin.error, newLogin.error?.message);

  const reused = await fetch(callbackUrl, { redirect: "manual" });
  check(
    "a used code is rejected",
    new URL(reused.headers.get("location")).searchParams.get("error") === "link",
    reused.headers.get("location"),
  );
}

// Open redirect -------------------------------------------------------------
// Uses a real recovery code each time, so the `next` handling is what decides
// the destination.
// A fresh user per case: Supabase sends at most one recovery email per user
// per minute.
{
  for (const [index, next] of ["//evil.example", "https://evil.example", "/\\evil.example"].entries()) {
    const email = `redirect-${index}-${Date.now()}@auth-test.example`;
    await session().supabase.auth.signUp({ email, password: "redirect-pass-1" });
    const browser = session();
    await browser.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${BASE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    });
    const message = await latestEmailTo(email);
    const link = message?.Text?.match(/https?:\/\/\S+/)?.[0]?.replace(/&amp;/g, "&");
    const verify = await fetch(link, { redirect: "manual" });
    const callback = await fetch(verify.headers.get("location"), {
      redirect: "manual",
      headers: { cookie: browser.cookie() },
    });
    const location = new URL(callback.headers.get("location"), BASE_URL);
    check(
      `callback ignores next=${next}`,
      ["localhost", "127.0.0.1"].includes(location.hostname) && location.pathname === "/dashboard",
      location.href,
    );
  }
}

// Trainer route limits --------------------------------------------------------
{
  const trainer = session();
  await trainer.supabase.auth.signInWithPassword({ email: "trainer@roystian.demo", password: "trainer123" });
  const status = async (path) =>
    (await fetch(`${BASE_URL}${path}`, { redirect: "manual", headers: { cookie: trainer.cookie() } })).status;

  for (const path of ["/admin/students", "/admin/assignments", "/admin/trainers"]) {
    check(`trainer can open ${path}`, (await status(path)) === 200);
  }
  for (const path of ["/admin", "/admin/payments", "/admin/settings", "/admin/leads", "/admin/analytics"]) {
    check(`trainer is redirected away from ${path}`, (await status(path)) === 307);
  }
}

// Security headers -------------------------------------------------------------
{
  const res = await fetch(`${BASE_URL}/`);
  const csp = res.headers.get("content-security-policy") ?? "";
  check("CSP is sent", csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"), csp);
  check("CSP allows the Supabase origin", csp.includes(new URL(SUPABASE_URL).origin));
  check("nosniff is sent", res.headers.get("x-content-type-options") === "nosniff");
  check("framing is denied", res.headers.get("x-frame-options") === "DENY");
  check("X-Powered-By is hidden", !res.headers.get("x-powered-by"));
}

console.log(failures === 0 ? "\nAUTH CHECKS PASSED" : `\n${failures} AUTH CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
