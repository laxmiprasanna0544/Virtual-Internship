import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

/**
 * Cryptographic primitives for the built-in authentication. Node's own
 * crypto only — no native modules to build for each platform.
 */

/* ------------------------------------------------------------------ */
/*  AUTH_SECRET-derived keys                                           */
/* ------------------------------------------------------------------ */

function authSecret(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 random characters");
  return Buffer.from(secret, "utf8");
}

/** Separate keys per use, so one leaking can't be used for another. */
function derivedKey(purpose: "codes" | "totp"): Buffer {
  return Buffer.from(hkdfSync("sha256", authSecret(), Buffer.alloc(0), `roystian-${purpose}`, 32));
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/* ------------------------------------------------------------------ */
/*  Passwords (scrypt)                                                 */
/* ------------------------------------------------------------------ */

// N=2^15, r=8, p=1: ~32 MiB and tens of milliseconds per hash.
const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

function scrypt(password: string, salt: Buffer, params = SCRYPT): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(
      password.normalize("NFKC"),
      salt,
      params.keylen,
      { N: params.N, r: params.r, p: params.p, maxmem: params.maxmem },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}

/** "scrypt$N$r$p$salt$hash" (base64url), self-describing so parameters can change later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scrypt(password, Buffer.from(salt, "base64url"), {
    ...SCRYPT,
    N: Number(n),
    r: Number(r),
    p: Number(p),
    keylen: expected.length,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Spends the same time as a real check, so unknown accounts can't be detected by timing. */
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + Buffer.alloc(64).toString("base64url");
export async function burnPasswordCheck(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_HASH);
}

/** Same rules the sign-up form shows: 10+ characters with upper, lower and a number. */
export function passwordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 10 &&
    password.length <= 256 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

/* ------------------------------------------------------------------ */
/*  One-time codes and opaque tokens                                   */
/* ------------------------------------------------------------------ */

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codes are stored keyed-hashed: a database copy alone can't be used to guess them offline. */
export function hashCode(code: string): string {
  return createHmac("sha256", derivedKey("codes")).update(code).digest("base64url");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

/* ------------------------------------------------------------------ */
/*  Authenticator-app secrets (encrypted at rest)                      */
/* ------------------------------------------------------------------ */

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey("totp"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decryptSecret(sealed: string): string {
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1") throw new Error("Unknown secret format");
  const decipher = createDecipheriv("aes-256-gcm", derivedKey("totp"), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

/* ------------------------------------------------------------------ */
/*  TOTP (RFC 6238: SHA-1, 6 digits, 30-second steps)                  */
/* ------------------------------------------------------------------ */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(secret: string): Buffer {
  let bits = "";
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new Error("Invalid base32");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpAt(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

/**
 * Accepts the current 30-second step and one on either side (clock drift).
 * Returns the matched step so a code can't be replayed within its window.
 */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(now / 1000 / 30);
  for (const candidate of [step, step - 1, step + 1]) {
    if (safeEqual(totpAt(secret, candidate), code)) return candidate;
  }
  return null;
}
