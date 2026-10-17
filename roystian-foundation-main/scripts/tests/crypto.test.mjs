/**
 * Unit checks for lib/server/crypto.ts: TOTP against the RFC 6238 test
 * vectors, password hashing, encrypted secrets, the password policy and
 * one-time codes. Needs no server.
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";

const ROOT = new URL("../..", import.meta.url).pathname;
process.env.AUTH_SECRET ??= randomBytes(32).toString("hex");
execSync("npx tsc -p tsconfig.selftest.json", { cwd: ROOT, stdio: "inherit" });
const require = createRequire(import.meta.url);
require(`${ROOT}.selftest-register.cjs`);
const c = require(`${ROOT}.selftest/lib/server/crypto.js`);

let passed = 0;
let failed = 0;
function check(label, ok, detail) {
  ok ? (passed += 1) : (failed += 1);
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${!ok && detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
}

console.log("\n## TOTP (RFC 6238, SHA-1, 6 digits)");
// Key "12345678901234567890" from RFC 6238 Appendix B, base32-encoded.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
for (const [t, expected] of [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
  [20000000000, "353130"],
]) {
  check(`T=${t} → ${expected}`, c.totpAt(RFC_SECRET, Math.floor(t / 30)) === expected, c.totpAt(RFC_SECRET, Math.floor(t / 30)));
}
const now = Date.now();
const step = Math.floor(now / 30000);
check("current code accepted", c.verifyTotp(RFC_SECRET, c.totpAt(RFC_SECRET, step), now) === step);
check("one step of clock drift accepted", c.verifyTotp(RFC_SECRET, c.totpAt(RFC_SECRET, step - 1), now) === step - 1);
check("codes two steps old rejected", c.verifyTotp(RFC_SECRET, c.totpAt(RFC_SECRET, step - 2), now) === null || c.totpAt(RFC_SECRET, step - 2) === c.totpAt(RFC_SECRET, step));
check("non-numeric code rejected", c.verifyTotp(RFC_SECRET, "abcdef", now) === null);
const secret = c.newTotpSecret();
check("new secrets are 32 base32 characters (160 bits)", /^[A-Z2-7]{32}$/.test(secret), secret);
check("new secrets are random", c.newTotpSecret() !== secret);

console.log("\n## Passwords (scrypt)");
const hash = await c.hashPassword("Str0ngPassword1");
check("self-describing scrypt format", /^scrypt\$32768\$8\$1\$[\w-]{22}\$[\w-]{86}$/.test(hash), hash);
check("correct password verifies", await c.verifyPassword("Str0ngPassword1", hash));
check("wrong password rejected", !(await c.verifyPassword("Str0ngPassword2", hash)));
check("salted: same password, different hash", (await c.hashPassword("Str0ngPassword1")) !== hash);
check("malformed stored hash rejected", !(await c.verifyPassword("x", "md5$abc")));
const t0 = Date.now();
await c.burnPasswordCheck("anything");
const burn = Date.now() - t0;
const t1 = Date.now();
await c.verifyPassword("Str0ngPassword1", hash);
const real = Date.now() - t1;
check("unknown-account check costs about the same as a real one", burn > real / 3, { burn, real });

console.log("\n## Password policy");
for (const weak of ["Short1A", "alllowercase123", "ALLUPPERCASE123", "NoDigitsInHere", "x".repeat(300) + "A1a"]) {
  check(`rejects ${JSON.stringify(weak.slice(0, 20))}`, !c.passwordMeetsPolicy(weak));
}
check("accepts Str0ngPassword1", c.passwordMeetsPolicy("Str0ngPassword1"));

console.log("\n## Encrypted secrets (AES-256-GCM)");
const sealed = c.encryptSecret("JBSWY3DPEHPK3PXP");
check("round-trips", c.decryptSecret(sealed) === "JBSWY3DPEHPK3PXP");
check("ciphertext doesn't contain the secret", !sealed.includes("JBSWY3DPEHPK3PXP"));
check("random IV: same secret seals differently", c.encryptSecret("JBSWY3DPEHPK3PXP") !== sealed);
let tamperRejected = false;
try {
  const parts = sealed.split(".");
  parts[3] = (parts[3][0] === "A" ? "B" : "A") + parts[3].slice(1);
  c.decryptSecret(parts.join("."));
} catch {
  tamperRejected = true;
}
check("tampered ciphertext rejected", tamperRejected);

console.log("\n## Codes and tokens");
const codes = Array.from({ length: 5000 }, () => c.newCode());
check("codes are always 6 digits", codes.every((x) => /^\d{6}$/.test(x)));
check("codes are spread out (>4900 distinct of 5000)", new Set(codes).size > 4900, new Set(codes).size);
check("code hashes are keyed (differ from a plain SHA-256)", c.hashCode("123456") !== require("node:crypto").createHash("sha256").update("123456").digest("base64url"));
check("tokens are 256-bit base64url", /^[\w-]{43}$/.test(c.newToken()));
check("token hash is not the token", c.hashToken("abc") !== "abc");
check("safeEqual", c.safeEqual("abc", "abc") && !c.safeEqual("abc", "abd") && !c.safeEqual("abc", "abcd"));

console.log(`\ncrypto: ${passed} passed, ${failed} failed, 0 skipped`);
process.exit(failed ? 1 : 0);
