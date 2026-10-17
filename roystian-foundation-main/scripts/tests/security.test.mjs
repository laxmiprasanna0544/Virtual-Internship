/**
 * Security properties of the deployed app: headers, CSRF origin checks,
 * authentication on every API route, redirects, upload abuse, input
 * validation, rate limits, robots/sitemap and access-token verification.
 */
import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import {
  BASE,
  check,
  Client,
  curriculum,
  enrol,
  env,
  finish,
  newStudent,
  section,
  SITE_ORIGIN,
  sql,
  uniqueEmail,
} from "./lib.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const LEAKS = /at \S+ \(|\.ts:\d+|\.js:\d+|syntax error at|relation "|postgres|select .* from|localhost:55432|moto:5000|\bstack\b/i;


/* ------------------------------------------------------------------ */
/*  Route inventory from the filesystem                                */
/* ------------------------------------------------------------------ */

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? walk(path) : name === "route.ts" ? [path] : [];
  });
}
const routes = walk(`${ROOT}app/api`).map((file) => {
  const source = execSync(`cat "${file}"`).toString();
  const methods = [...source.matchAll(/export (?:async )?function (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
  const path = file
    .slice(`${ROOT}app`.length, -"/route.ts".length)
    .replace(/\[assessmentId\]/, "ai-ml-m01-assessment")
    .replace(/\[slug\]/, "no-such-profile")
    .replace(/\[id\]/, "RF-NONE-2026-000000");
  return { path, methods };
});
const PUBLIC = [
  /^\/api\/health(\/ready)?$/,
  /^\/api\/auth\//,
  /^\/api\/leads$/,
  /^\/api\/certificates\/verify\//,
  /^\/api\/profiles\//,
  /^\/api\/payment\/webhook$/,
];
const isPublic = (path) => PUBLIC.some((re) => re.test(path));
check("route inventory found the API", routes.length >= 50, routes.length);

/* ------------------------------------------------------------------ */
section("Security headers");
const anon = new Client("sec-anon");
for (const path of ["/", "/login", "/verify", "/api/auth/session"]) {
  const res = await anon.get(path);
  const csp = res.headers.get("content-security-policy") ?? "";
  check(`${path}: CSP present`, Boolean(csp), res.status);
  check(`${path}: CSP has no 'unsafe-eval' in production`, !csp.includes("unsafe-eval"), csp);
  check(`${path}: CSP frame-ancestors 'none'`, /frame-ancestors 'none'/.test(csp));
  check(`${path}: CSP object-src 'none'`, /object-src 'none'/.test(csp));
  const scriptSrc = /script-src ([^;]+)/.exec(csp)?.[1] ?? "";
  check(`${path}: script-src has no wildcard sources`, !/(^|\s)\*|https?:\s|https:\/\/\*/.test(scriptSrc), scriptSrc);
  check(`${path}: CSP allows Cashfree SDK`, /https:\/\/sdk\.cashfree\.com/.test(csp));
  check(`${path}: CSP allows the uploads origin (S3)`, csp.includes(new URL(env.S3_ENDPOINT).origin), csp);
  check(`${path}: HSTS`, /max-age=\d{8}/.test(res.headers.get("strict-transport-security") ?? ""));
  check(`${path}: X-Frame-Options DENY`, res.headers.get("x-frame-options") === "DENY");
  check(`${path}: X-Content-Type-Options nosniff`, res.headers.get("x-content-type-options") === "nosniff");
  check(`${path}: Referrer-Policy`, res.headers.get("referrer-policy") === "strict-origin-when-cross-origin");
  check(`${path}: Permissions-Policy`, /camera=\(\)/.test(res.headers.get("permissions-policy") ?? ""));
  check(`${path}: no X-Powered-By`, !res.headers.get("x-powered-by"));
}

/* ------------------------------------------------------------------ */
section("CSRF: mutating API routes require the site's Origin");
const posts = routes.filter((r) => r.methods.includes("POST"));
for (const { path } of posts) {
  if (path === "/api/payment/webhook") continue;
  const missing = await anon.request("POST", path, {}, { origin: null });
  const foreign = await anon.request("POST", path, {}, { origin: "https://evil.example" });
  check(`${path}: no Origin → 403`, missing.status === 403, missing.status);
  check(`${path}: foreign Origin → 403`, foreign.status === 403, foreign.status);
}
{
  const body = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: { order: { order_id: "RF-UNKNOWN-ORDER", order_amount: 1500 }, payment: { cf_payment_id: 1, payment_group: "upi" } },
  });
  const ts = String(Math.floor(Date.now() / 1000));
  let res = await anon.request("POST", "/api/payment/webhook", body, {
    origin: null,
    headers: { "x-webhook-timestamp": ts, "x-webhook-signature": "bm90LWEtc2lnbmF0dXJl" },
  });
  check("webhook without Origin is not blocked by CSRF but bad signature → 401", res.status === 401, res.status);
  res = await anon.request("POST", "/api/payment/webhook", body, { origin: null });
  check("webhook with no signature → 401", res.status === 401, res.status);
  const sig = createHmac("sha256", env.CASHFREE_SECRET_KEY).update(ts + body).digest("base64");
  res = await anon.request("POST", "/api/payment/webhook", body, {
    origin: null,
    headers: { "x-webhook-timestamp": ts, "x-webhook-signature": sig },
  });
  check("correctly signed webhook (unknown order) accepted without effect", res.status === 200, res.status);
}

/* ------------------------------------------------------------------ */
section("Authentication on every API route (signed out)");
for (const { path, methods } of routes) {
  if (isPublic(path)) continue;
  for (const method of methods) {
    const res = await anon.request(method, path, method === "GET" ? undefined : {});
    check(`${method} ${path} signed out → 401/403`, res.status === 401 || res.status === 403, res.status);
    check(`${method} ${path} error body has no internals`, !LEAKS.test(res.text), res.text.slice(0, 120));
  }
}
for (const path of ["/api/auth/mfa/setup", "/api/auth/mfa/enable"]) {
  const res = await anon.post(path, { code: "123456" });
  check(`POST ${path} signed out → 401`, res.status === 401, res.status);
}
const sessionRes = await anon.get("/api/auth/session");
check("GET /api/auth/session signed out → user null", sessionRes.json?.user === null, sessionRes.text);
const publicList = routes.filter((r) => isPublic(r.path)).map((r) => r.path);
console.log(`     intentionally public: ${publicList.join(", ")}`);

/* ------------------------------------------------------------------ */
section("Private responses are not cacheable");
const stu = new Client("sec-student");
const me = await newStudent(stu, { name: "Security Student" });
for (const path of ["/api/auth/session", "/api/student/records", "/api/notifications"]) {
  const res = await stu.get(path);
  const cc = res.headers.get("cache-control") ?? "";
  check(`${path}: 200 for the owner`, res.status === 200, res.status);
  check(`${path}: Cache-Control private/no-store`, /no-store|private/.test(cc), cc);
}

/* ------------------------------------------------------------------ */
section("Protected pages redirect signed-out users to /login");
for (const page of ["/dashboard", "/admin", "/campus", "/partner", "/checkout", "/payment/status", "/account/security"]) {
  const res = await anon.get(page);
  const location = res.headers.get("location") ?? "";
  const url = new URL(location, BASE);
  check(`${page} → /login`, res.status === 307 && url.pathname === "/login", `${res.status} ${location}`);
  check(`${page}: next is a same-site path`, url.origin === new URL(BASE).origin && url.searchParams.get("next") === page, location);
}
for (const next of ["//evil.example", "https://evil.example", "/\\evil.example"]) {
  const res = await anon.get(`/login?next=${encodeURIComponent(next)}`);
  check(`/login?next=${next} renders (no server redirect off-site)`, res.status === 200 && !res.headers.get("location"), res.status);
}
curriculum(); // compiles lib/ into .selftest
const { safeNext } = createRequire(import.meta.url)(`${ROOT}.selftest/lib/safe-next.js`);
for (const value of ["//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)"]) {
  check(`safeNext rejects ${value}`, safeNext(value) === null, safeNext(value));
}
check("safeNext keeps same-site paths", safeNext("/dashboard?x=1") === "/dashboard?x=1");

/* ------------------------------------------------------------------ */
section("Upload abuse");
await enrol(stu, "ai-ml", "self-paced");
const uploadReq = (over) =>
  stu.post("/api/uploads", { purpose: "submission", domainId: "ai-ml", fileName: "r.pdf", contentType: "application/pdf", size: 1000, ...over });
let res = await uploadReq({ size: 25 * 1024 * 1024 });
check("declared size over 20MB → 413", res.status === 413, res.status);
res = await uploadReq({ fileName: "x.html", contentType: "text/html" });
check("text/html → 415", res.status === 415, res.status);
res = await uploadReq({ fileName: "x.svg", contentType: "image/svg+xml" });
check("image/svg+xml → 415", res.status === 415, res.status);
res = await uploadReq({ fileName: "r.pdf", contentType: "text/html" });
check("allowed extension with forbidden content type → 415", res.status === 415, res.status);
res = await uploadReq({ domainId: "python-development" });
check("upload for an unpaid domain → 403", res.status === 403, res.status);
res = await uploadReq({ fileName: "../../../etc/passwd.pdf" });
check("traversal-style file name accepted but sanitised", res.status === 200, res.text);
const key = res.json?.key ?? "";
check("key keeps the owner prefix and has no '..' path segments", key.startsWith(`submissions/${me.id}/ai-ml/`) && !key.split("/").includes("..") && key.split("/").length === 4, key);

const responseText = "y".repeat(400);
async function directUpload(over, bytes, contentType) {
  const r = await uploadReq(over);
  const form = new FormData();
  for (const [k, v] of Object.entries(r.json.fields)) form.append(k, k === "Content-Type" ? contentType : v);
  form.append("file", new Blob([bytes], { type: contentType }), "f");
  const s3 = await fetch(r.json.url, { method: "POST", body: form });
  return { key: r.json.key, s3: s3.status };
}
async function objectExists(objectKey) {
  const r = await fetch(`${env.S3_ENDPOINT}/${env.S3_UPLOADS_BUCKET}/${objectKey}`, { method: "HEAD" });
  return r.status === 200;
}

const big = await directUpload({}, Buffer.alloc(21 * 1024 * 1024, 1), "application/pdf");
check("emulator stored an oversize object (S3 itself enforces the policy in AWS)", big.s3 < 300, big.s3);
res = await stu.post("/api/student/submission", { domainId: "ai-ml", responseText, fileKey: big.key, fileName: "r.pdf" });
check("submitting an oversize object is rejected (422)", res.status === 422, res.text);
check("oversize object deleted by the server", !(await objectExists(big.key)));

const html = await directUpload({}, Buffer.from("<script>alert(1)</script>"), "text/html");
res = await stu.post("/api/student/submission", { domainId: "ai-ml", responseText, fileKey: html.key, fileName: "r.pdf" });
check("object stored as text/html is rejected (422)", res.status === 422, res.text);
check("text/html object deleted by the server", !(await objectExists(html.key)));

const other = new Client("sec-other");
const otherMe = await newStudent(other, { name: "Other Student" });
await enrol(other, "ai-ml", "self-paced");
const theirs = await directUpload({}, Buffer.from("%PDF-1.4 theirs"), "application/pdf");
res = await other.post("/api/student/submission", { domainId: "ai-ml", responseText, fileKey: theirs.key, fileName: "r.pdf" });
check("another student's object key is rejected (400)", res.status === 400, res.text);
res = await stu.post("/api/student/submission", { domainId: "ai-ml", responseText, fileKey: `submissions/${me.id}/ai-ml/../../${otherMe.id}/x.pdf`, fileName: "r.pdf" });
check("key with '..' segments is rejected", res.status === 400 || res.status === 422, res.status);

/* ------------------------------------------------------------------ */
section("Input validation");
for (const path of ["/api/auth/login", "/api/auth/signup", "/api/leads", "/api/assessments/submit", "/api/student/modules", "/api/uploads", "/api/submissions/validate", "/api/payment/create-order"]) {
  const r = await stu.request("POST", path, "{not json", {});
  check(`${path}: malformed JSON → 400`, r.status === 400, r.status);
  check(`${path}: error has no internals`, !LEAKS.test(r.text), r.text.slice(0, 120));
}
res = await stu.request("POST", "/api/student/notes", JSON.stringify({ domainId: "ai-ml", moduleId: "ai-ml-m01", note: "z".repeat(500_000) }));
check("oversized note → 4xx, not 500", res.status >= 400 && res.status < 500, res.status);
for (const evil of ["' OR '1'='1", "1;drop table profiles--", "%27%3B--"]) {
  const r1 = await anon.get(`/api/certificates/verify/${encodeURIComponent(evil)}`);
  check(`verify ${evil} → 404`, r1.status === 404 || r1.status === 400, r1.status);
  const r2 = await anon.get(`/api/profiles/${encodeURIComponent(evil)}`);
  check(`profile ${evil} → 404`, r2.status === 404 || r2.status === 400, r2.status);
  const r3 = await stu.get(`/api/payment/verify?orderId=${encodeURIComponent(evil)}`);
  check(`payment verify ${evil} → 4xx`, r3.status >= 400 && r3.status < 500, r3.status);
  const r4 = await stu.get(`/api/assessments/${encodeURIComponent(evil)}`);
  check(`assessment ${evil} → 404`, r4.status === 404, r4.status);
  for (const r of [r1, r2, r3, r4]) if (LEAKS.test(r.text)) check("no internals in error", false, r.text.slice(0, 120));
}
const [{ count }] = await sql`select count(*)::int from public.profiles`;
check("profiles table intact after injection attempts", count > 0);

/* ------------------------------------------------------------------ */
section("Rate limits");
const lead = (c) =>
  c.post("/api/leads", { collegeName: "Rate Test College", contactPerson: "Tester", email: "lead@test.roystian.local" });
async function until429(fn, max) {
  let r;
  for (let i = 1; i <= max; i += 1) {
    r = await fn();
    if (r.status === 429) return { at: i, r };
  }
  return { at: null, r };
}
// Per-IP limits are deliberately generous (a college lab shares one public
// IP); per-account limits are strict. See lib/server/rate-limit.ts callers.
const leadClient = new Client("sec-leads");
let out = await until429(() => lead(leadClient), 12);
check("leads: 11th submission from one IP in 10 min → 429", out.at === 11, out.at);
check("leads 429 has Retry-After", Boolean(out.r.headers.get("retry-after")));
res = await lead(new Client("sec-leads-2"));
check("leads: a different viewer IP is unaffected", res.status === 200, res.status);
res = await leadClient.post("/api/leads", { collegeName: "Bot College", contactPerson: "Bot", email: "b@x.io", website: "spam" });
check("leads honeypot filled → rejected", res.status === 400 || res.status === 429, res.status);

const signupClient = new Client("sec-signup");
const signupEmail = uniqueEmail("ratelimit");
const signupBody = { name: "Rate Limit", email: signupEmail, password: "Str0ngPassword1" };
out = await until429(() => signupClient.post("/api/auth/signup", signupBody), 6);
check("signup: 4th attempt for the same email in 10 min → 429", out.at === 4, out.at);
check("signup 429 has Retry-After", Boolean(out.r.headers.get("retry-after")));
res = await signupClient.post("/api/auth/signup", { name: "x" });
check("signup: other requests from the same IP still allowed (400 for a bad body, not 429)", res.status === 400, res.status);

const forgotClient = new Client("sec-forgot");
const forgotEmail = uniqueEmail("nobody");
out = await until429(() => forgotClient.post("/api/auth/forgot", { email: forgotEmail }), 6);
check("forgot-password: 4th request for the same email in 10 min → 429", out.at === 4, out.at);
res = await forgotClient.post("/api/auth/forgot", { email: uniqueEmail("nobody") });
check("forgot-password: a different email from the same IP is unaffected", res.status === 200, res.status);
out = await until429(() => uploadReq({}), 25);
check("uploads: limited after 20 per user per 10 min (429)", out.at !== null && out.at <= 21, out.at);

/* ------------------------------------------------------------------ */
section("Health, robots, sitemap");
res = await fetch(`${BASE}/api/health`);
check("/api/health 200 {ok:true} without cookies", res.status === 200 && (await res.json()).ok === true);
check("/api/health is not processed by middleware", !res.headers.get("content-security-policy"));
res = await fetch(`${BASE}/api/health/ready`);
check("/api/health/ready reports the database", res.status === 200 && (await res.json()).database === "ok");
const robots = await (await fetch(`${BASE}/robots.txt`)).text();
for (const path of ["/api/", "/admin", "/dashboard", "/campus", "/partner", "/checkout", "/payment", "/account"]) {
  check(`robots.txt disallows ${path}`, robots.split("\n").some((l) => l.trim() === `Disallow: ${path}`), robots);
}
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
check("sitemap uses NEXT_PUBLIC_SITE_URL", sitemap.includes(`<loc>${SITE_ORIGIN}`) && !/vercel\.app/.test(sitemap), sitemap.slice(0, 200));

/* ------------------------------------------------------------------ */
section("Session tokens");
async function sessionWith(token) {
  const c = new Client("token");
  c.cookies.set("rf_session", token);
  return (await c.get("/api/auth/session")).json?.user ?? null;
}
const signedIn = new Client("token-owner");
await signedIn.post("/api/auth/logout", {});
const mine = await newStudent(signedIn);
const realToken = signedIn.rawCookie("rf_session");
check("control: the real session token is accepted", (await sessionWith(realToken))?.id === mine.id);
const [{ token_hash: storedHash }] = await sql`select token_hash from identity.sessions where user_id = ${mine.id} order by created_at desc limit 1`;
check("the database hash of a token is not itself a valid token", (await sessionWith(storedHash)) === null);
check("a token with one character changed is rejected", (await sessionWith(realToken.slice(0, -1) + (realToken.endsWith("x") ? "y" : "x"))) === null);
await sql`update identity.sessions set expires_at = now() - interval '1 second' where token_hash = ${storedHash}`;
check("an expired session is rejected", (await sessionWith(realToken)) === null);
await sql`update identity.sessions set expires_at = now() + interval '1 day', last_seen_at = now() - interval '8 days' where token_hash = ${storedHash}`;
check("a session idle for more than 7 days is rejected", (await sessionWith(realToken)) === null);
await sql`update identity.sessions set last_seen_at = now() where token_hash = ${storedHash}`;
check("control: the restored session works again", (await sessionWith(realToken))?.id === mine.id);
await sql`update identity.users set disabled_at = now() where id = ${mine.id}`;
check("a disabled account's session is rejected", (await sessionWith(realToken)) === null);
await sql`update identity.users set disabled_at = null where id = ${mine.id}`;
const [{ count: anonReadable }] = await sql.begin(async (tx) => {
  await tx`set local role anon`;
  return tx`select count(*)::int as count from information_schema.tables where table_schema = 'identity'`;
});
check("the identity schema is invisible to the request roles", anonReadable === 0, anonReadable);
let identityError = null;
await sql.begin(async (tx) => {
  await tx`select set_config('app.user_id', ${mine.id}, true), set_config('app.role', 'authenticated', true)`;
  await tx`set local role authenticated`;
  await tx`select * from identity.users`.catch((e) => (identityError = e.code));
}).catch(() => {});
check("authenticated users cannot read password hashes or sessions (42501)", identityError === "42501", identityError);

await finish("security");
