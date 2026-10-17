/**
 * Built-in authentication: sign-up with an emailed code, confirmation,
 * sign-in, session cookie, session revocation, password reset, email change,
 * authenticator-app MFA (including replay), lockout, suspension, and the
 * staff MFA requirement.
 */
import {
  check,
  Client,
  enrolMfa,
  finish,
  latestCode,
  newStaff,
  newStudent,
  nextTotp,
  PASSWORD,
  section,
  sentEmails,
  sql,
  totp,
  uniqueEmail,
} from "./lib.mjs";

const wrongCode = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

section("Sign-up");
const c = new Client("auth");
const email = uniqueEmail("auth");

let res = await c.post("/api/auth/signup", { name: "Auth Tester", email, password: "short" });
check("weak password is rejected (400)", res.status === 400, res.status);
res = await c.post("/api/auth/signup", { name: "Auth Tester", email, password: "alllowercase12" });
check("password without upper case is rejected by the password policy", res.status === 400, res.text);
res = await c.post("/api/auth/signup", { name: "Auth Tester", email: "not-an-email", password: PASSWORD });
check("invalid email is rejected (400)", res.status === 400, res.status);

res = await c.post("/api/auth/signup", {
  name: "Auth Tester",
  email,
  password: PASSWORD,
  mobile: "9876543210",
  college: "Vignan Institute of Technology",
  educationLevel: "postgraduate",
  role: "admin",
});
check("sign-up succeeds and asks for email confirmation", res.status === 200 && res.json?.needsConfirmation === true, res.text);

const [profile] = await sql`select p.*, s.education_level from public.profiles p join public.students s on s.id = p.id where p.email = ${email}`;
check("profile + student rows created at sign-up", Boolean(profile), profile);
check("every sign-up is a student, whatever the request says", profile?.role === "student", profile?.role);
check("sign-up details stored", profile?.education_level === "postgraduate", profile?.education_level);

const [identity] = await sql`select password_hash, email_verified_at from identity.users where id = ${profile.id}`;
check("password stored only as a salted scrypt hash", /^scrypt\$32768\$8\$1\$/.test(identity.password_hash) && !identity.password_hash.includes(PASSWORD), identity.password_hash.slice(0, 20));
check("account starts unverified", identity.email_verified_at === null);
const [codeRow] = await sql`select code_hash from identity.codes where user_id = ${profile.id} and purpose = 'verify-email'`;
const firstCode = await latestCode(email, /verification/i);
check("verification code emailed (6 digits)", /^\d{6}$/.test(firstCode), firstCode);
check("code stored only as a keyed hash", Boolean(codeRow) && !codeRow.code_hash.includes(firstCode), codeRow);

res = await c.post("/api/auth/signup", { name: "Again", email, password: PASSWORD });
check("duplicate email is refused (409)", res.status === 409, res.status);

section("Confirmation gate");
res = await c.post("/api/auth/login", { email, password: PASSWORD });
check("unconfirmed account cannot sign in (403 needsConfirmation)", res.status === 403 && res.json?.needsConfirmation, res.text);
check("no session cookie for an unconfirmed account", !c.rawCookie("rf_session"));
res = await c.post("/api/auth/confirm", { email, code: "12" });
check("malformed confirmation code rejected (400)", res.status === 400, res.status);
res = await c.post("/api/auth/confirm", { email, code: wrongCode(firstCode) });
check("wrong confirmation code rejected", res.status === 400 && /not correct/.test(res.json?.error), res.text);
await new Promise((r) => setTimeout(r, 5));
res = await c.post("/api/auth/resend", { email });
check("resend issues a new code", res.status === 200);
const secondCode = await waitForNewCode(email, firstCode);
res = await c.post("/api/auth/confirm", { email, code: firstCode === secondCode ? wrongCode(secondCode) : firstCode });
check("the superseded code no longer works", res.status === 400, res.text);
res = await c.post("/api/auth/confirm", { email, code: secondCode });
check("current code confirms the account", res.status === 200, res.text);

async function waitForNewCode(to, previous) {
  for (let i = 0; i < 50; i += 1) {
    const code = await latestCode(to, /verification/i);
    const count = sentEmails().filter((m) => m.to === to && /verification/i.test(m.subject)).length;
    if (count >= 2) return code;
    await new Promise((r) => setTimeout(r, 100));
  }
  return previous;
}

section("Code attempts are limited");
const limiter = new Client("code-limit");
const limitedEmail = uniqueEmail("codes");
await limiter.post("/api/auth/signup", { name: "Code Limit", email: limitedEmail, password: PASSWORD });
const realCode = await latestCode(limitedEmail, /verification/i);
for (let i = 0; i < 5; i += 1) await limiter.post("/api/auth/confirm", { email: limitedEmail, code: wrongCode(realCode) });
res = await limiter.post("/api/auth/confirm", { email: limitedEmail, code: realCode });
check("after 5 wrong attempts even the right code is refused", res.status === 400 && /expired/i.test(res.json?.error), res.text);

section("Sign-in and session cookie");
res = await c.post("/api/auth/login", { email, password: "Wrong-password-1" });
check("wrong password → 401 with a generic message", res.status === 401 && /Incorrect email or password/.test(res.json?.error), res.text);
res = await c.post("/api/auth/login", { email: uniqueEmail("nobody"), password: PASSWORD });
check("unknown account → the same 401 (no account discovery)", res.status === 401 && /Incorrect email or password/.test(res.json?.error), res.text);

res = await c.post("/api/auth/login", { email: email.toUpperCase(), password: PASSWORD });
check("sign-in succeeds (email is case-insensitive)", res.status === 200 && res.json?.user?.role === "student", res.text);
const line = c.setCookies.find((l) => l.startsWith("rf_session=")) ?? "";
check("rf_session cookie is HttpOnly, SameSite=Lax, Path=/", /HttpOnly/i.test(line) && /SameSite=lax/i.test(line) && /Path=\//i.test(line), line.slice(0, 80));
check("session cookie lasts 30 days", /Max-Age=2592000/i.test(line), line);
const token = c.rawCookie("rf_session");
check("session token is a 256-bit random value", /^[A-Za-z0-9_-]{43}$/.test(token ?? ""), token?.length);
check("the token is never in the JSON body", !res.text.includes(token), "token in body");
const [stored] = await sql`select token_hash from identity.sessions where user_id = ${profile.id} and revoked_at is null`;
check("only the token's hash is stored", Boolean(stored) && stored.token_hash !== token, stored);

res = await c.get("/api/auth/session");
check("session endpoint returns the signed-in student", res.json?.user?.email === email, res.text);
res = await c.get("/dashboard");
check("student can open /dashboard", res.status === 200, res.status);
res = await c.get("/admin");
check("student is redirected away from /admin", res.status === 307 && /\/dashboard/.test(res.headers.get("location")), res.headers.get("location"));

section("Session tokens can't be forged");
for (const [label, value] of [
  ["random token", "A".repeat(43)],
  ["modified token", token.slice(0, -1) + (token.endsWith("A") ? "B" : "A")],
  ["the stored hash instead of the token", stored.token_hash],
  ["an overlong value", "x".repeat(3000)],
]) {
  const forged = new Client("forged");
  forged.cookies.set("rf_session", value);
  res = await forged.get("/api/auth/session");
  check(`${label} is rejected`, res.json?.user === null, res.text);
}
const forgedPage = new Client("forged-page");
forgedPage.cookies.set("rf_session", "A".repeat(43));
res = await forgedPage.get("/dashboard");
check("a forged token cannot open protected pages", res.status === 307 && /\/login/.test(res.headers.get("location")), res.status);

section("Profile");
res = await c.post("/api/me/profile", {
  name: "Auth Tester Renamed",
  mobile: "9123456789",
  college: "BMS College of Engineering",
  course: "MCA",
  city: "Bengaluru",
  educationLevel: "postgraduate",
  role: "admin",
  status: "active",
});
check("student updates own profile", res.status === 200, res.text);
const [after] = await sql`select p.full_name, p.role, s.city from public.profiles p join public.students s on s.id = p.id where p.id = ${profile.id}`;
check("profile changes saved", after.full_name === "Auth Tester Renamed" && after.city === "Bengaluru", after);
check("role cannot be changed through the profile route", after.role === "student", after.role);

section("Sign-out revokes the session on the server");
const copy = new Client("stolen-cookie");
copy.cookies.set("rf_session", token);
res = await copy.get("/api/auth/session");
check("a copy of the cookie works before sign-out", res.json?.user?.email === email);
res = await c.post("/api/auth/logout", {});
check("logout succeeds", res.status === 200);
check("logout clears the cookie", !c.rawCookie("rf_session"));
res = await copy.get("/api/auth/session");
check("the same token no longer works anywhere after sign-out", res.json?.user === null, res.text);
const [revoked] = await sql`select revoked_at from identity.sessions where token_hash = ${stored.token_hash}`;
check("session marked revoked in the database", revoked?.revoked_at !== null, revoked);

section("Password reset (code by email)");
const nobody = uniqueEmail("nobody");
res = await c.post("/api/auth/forgot", { email: nobody });
check("forgot-password reports success for unknown accounts", res.status === 200);
check("no email is sent for unknown accounts", !sentEmails().some((m) => m.to === nobody));
const other = new Client("other-device");
await other.post("/api/auth/login", { email, password: PASSWORD });
res = await c.post("/api/auth/forgot", { email });
check("forgot-password sends a code", res.status === 200);
const resetCode = await latestCode(email, /reset/i);
res = await c.post("/api/auth/reset", { email, code: resetCode, password: "weak" });
check("reset rejects a weak password", res.status === 400, res.status);
res = await c.post("/api/auth/reset", { email, code: wrongCode(resetCode), password: "An0therStrongPass" });
check("reset rejects a wrong code", res.status === 400, res.status);
const NEW_PASSWORD = "An0therStrongPass";
res = await c.post("/api/auth/reset", { email, code: resetCode, password: NEW_PASSWORD });
check("reset with the emailed code succeeds", res.status === 200, res.text);
res = await other.get("/api/auth/session");
check("a password reset signs out every other session", res.json?.user === null, res.text);
res = await c.post("/api/auth/login", { email, password: PASSWORD });
check("the old password no longer works", res.status === 401, res.status);
res = await c.post("/api/auth/login", { email, password: NEW_PASSWORD });
check("sign-in with the new password works", res.status === 200, res.text);

section("Authenticator app (TOTP)");
const setup = await enrolMfa(c);
check("setup returns a base32 secret and an otpauth URI", /^[A-Z2-7]{32}$/.test(setup.secret) && setup.otpauth.startsWith("otpauth://totp/"), setup);
const [mfaRow] = await sql`select mfa_enabled from public.profiles where id = ${profile.id}`;
check("mfa_enabled recorded after a real code verified", mfaRow?.mfa_enabled === true, mfaRow);
const [secretRow] = await sql`select totp_secret from identity.users where id = ${profile.id}`;
check("authenticator secret stored encrypted", secretRow.totp_secret.startsWith("v1.") && !secretRow.totp_secret.includes(setup.secret));

await c.post("/api/auth/logout", {});
res = await c.post("/api/auth/login", { email, password: NEW_PASSWORD });
check("sign-in now asks for the authenticator code", res.json?.mfaRequired === true && !c.rawCookie("rf_session"), res.text);
check("challenge is kept in an HttpOnly cookie", /rf_mfa=.+HttpOnly/i.test(c.setCookies.join("\n")));
res = await c.post("/api/auth/mfa", { code: "abc" });
check("malformed code rejected", res.status === 400, res.status);
const step = Math.floor(Date.now() / 30000);
const valid = new Set([step - 1, step, step + 1].map((s) => totp(setup.secret, s)));
let bad = "000000";
while (valid.has(bad)) bad = wrongCode(bad);
res = await c.post("/api/auth/mfa", { code: bad });
check("wrong authenticator code rejected", res.status === 400, res.text);
const used = await nextTotp(c);
res = await c.post("/api/auth/mfa", { code: used });
check("right code completes sign-in", res.status === 200 && Boolean(c.rawCookie("rf_session")), res.text);

await c.post("/api/auth/logout", {});
await c.post("/api/auth/login", { email, password: NEW_PASSWORD });
res = await c.post("/api/auth/mfa", { code: used });
check("the same authenticator code cannot be replayed", res.status === 400, res.text);
const noChallenge = new Client("no-challenge");
res = await noChallenge.post("/api/auth/mfa", { code: totp(setup.secret) });
check("MFA step without a pending challenge is refused", res.status === 401, res.status);

section("Email change (code to the new address)");
const changer = new Client("email-change");
const original = await newStudent(changer);
const newEmail = uniqueEmail("changed");
res = await changer.post("/api/me/email", { email: newEmail });
check("email change starts and sends a code to the new address", res.status === 200 && res.json?.codeSent, res.text);
const changeCode = await latestCode(newEmail, /confirm/i);
check("the code goes to the new address only", !sentEmails().some((m) => m.to === original.email && /confirm your new email/i.test(m.subject)));
const [beforeChange] = await sql`select email from public.profiles where id = ${original.id}`;
check("the current address stays in use until confirmed", beforeChange.email === original.email, beforeChange);
res = await changer.post("/api/me/email/confirm", { code: "12" });
check("malformed code rejected", res.status === 400, res.status);
res = await changer.post("/api/me/email/confirm", { code: changeCode, email: "attacker@evil.example" });
check("email change confirmed", res.status === 200 && res.json?.email === newEmail, res.text);
const [row] = await sql`select p.email, u.email as login from public.profiles p join identity.users u on u.id = p.id where p.id = ${original.id}`;
check("profile and sign-in both use the verified new address (not the request body)", row?.email === newEmail && row?.login === newEmail, row);
res = await new Client("new-email").post("/api/auth/login", { email: newEmail, password: PASSWORD });
check("sign-in works with the new address", res.status === 200, res.text);

section("Suspension");
const victim = new Client("suspended");
const student = await newStudent(victim);
await sql`update public.students set status = 'suspended' where id = ${student.id}`;
res = await victim.get("/dashboard");
check("suspended student is signed out of protected pages", res.status === 307 && /error=suspended/.test(res.headers.get("location")), res.headers.get("location"));
res = await victim.post("/api/student/modules", { domainId: "ai-ml", moduleId: "ai-ml-m01", complete: true });
check("suspended student's API calls are refused (403)", res.status === 403 || res.status === 401, res.status);

section("Staff must enrol two-factor");
const staff = new Client("staff-no-mfa");
const admin = await newStaff(staff, "admin", { mfa: false });
res = await staff.post("/api/auth/login", { email: admin.email, password: PASSWORD });
check("staff sign-in flags MFA setup as required", res.json?.mfaSetupRequired === true, res.text);
res = await staff.get("/admin");
check("staff without MFA are sent to /account/security", res.status === 307 && /\/account\/security/.test(res.headers.get("location")), res.headers.get("location"));
res = await staff.get("/api/admin/data");
check("staff APIs refuse until MFA is enrolled", res.status === 403 && res.json?.code === "mfa_required", res.text);
await enrolMfa(staff);
res = await staff.get("/api/admin/data");
check("staff APIs work once MFA is enrolled", res.status === 200, res.status);

section("Account lockout (second layer behind rate limits)");
// The per-email rate limit (8 per 5 minutes) normally stops guessing first.
// The lockout is the backstop when several app instances each keep their own
// rate-limit counters, so simulate 9 earlier failures recorded on the account.
const lockClient = new Client("lockout");
const lockStudent = await newStudent(lockClient);
await sql`update identity.users set failed_logins = 9 where id = ${lockStudent.id}`;
res = await new Client("attacker").post("/api/auth/login", { email: lockStudent.email, password: "Guess10Password" });
check("the 10th wrong password is refused", res.status === 401, res.status);
const [lockRow] = await sql`select locked_until > now() as locked from identity.users where id = ${lockStudent.id}`;
check("the account is then locked in the database", lockRow?.locked === true, lockRow);
res = await new Client("owner").post("/api/auth/login", { email: lockStudent.email, password: PASSWORD });
check("while locked, even the right password is refused (429)", res.status === 429 && /15 minutes/.test(res.json?.error), res.text);
await sql`update identity.users set locked_until = now() - interval '1 second' where id = ${lockStudent.id}`;
res = await new Client("owner-later").post("/api/auth/login", { email: lockStudent.email, password: PASSWORD });
check("after the lock expires the right password works and the counter resets", res.status === 200, res.text);

section("Rate limiting");
const brute = new Client("brute");
const target = uniqueEmail("brute");
let limited = false;
for (let i = 0; i < 12; i += 1) {
  res = await brute.post("/api/auth/login", { email: target, password: `Guess${i}Password` });
  if (res.status === 429) {
    limited = true;
    break;
  }
}
check("repeated sign-in attempts are rate limited (429)", limited, res.status);
check("429 carries Retry-After", !limited || Boolean(res.headers.get("retry-after")));

await finish("auth");
