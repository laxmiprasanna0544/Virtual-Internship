import "server-only";

import { getSql, type Tx } from "@/lib/server/db";
import {
  burnPasswordCheck,
  decryptSecret,
  encryptSecret,
  hashCode,
  hashPassword,
  hashToken,
  newCode,
  newToken,
  newTotpSecret,
  passwordMeetsPolicy,
  safeEqual,
  verifyPassword,
  verifyTotp,
} from "@/lib/server/crypto";
import { sendEmail } from "@/lib/server/email";

/**
 * Built-in accounts: sign-up with an emailed code, sign-in, authenticator-app
 * two-factor, password reset, email change, and server-side sessions.
 * Everything lives in the `identity` schema, which request roles cannot read.
 *
 * Errors carry stable names the routes map to responses, e.g.
 * NotAuthorizedException, CodeMismatchException.
 */

export const SESSION_DAYS = 30;
const SESSION_IDLE_DAYS = 7;
const MFA_CHALLENGE_MINUTES = 5;
const MAX_CODE_ATTEMPTS = 5;
const MAX_FAILED_LOGINS = 10;
const LOCKOUT_MINUTES = 15;

const CODE_LIFETIME_MINUTES = {
  "verify-email": 24 * 60,
  "reset-password": 60,
  "change-email": 60,
} as const;
type CodePurpose = keyof typeof CODE_LIFETIME_MINUTES;

export function authError(name: string, message = name): Error {
  return Object.assign(new Error(message), { name });
}

/** Error name, e.g. "NotAuthorizedException". */
export function identityError(error: unknown): string {
  return typeof error === "object" && error && "name" in error ? String((error as { name: unknown }).name) : "Error";
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  pending_email: string | null;
  disabled_at: string | null;
  totp_secret: string | null;
  totp_enabled_at: string | null;
  totp_last_step: string | null;
  failed_logins: number;
  locked_until: string | null;
}

async function userByEmail(tx: Tx | ReturnType<typeof getSql>, email: string): Promise<UserRow | null> {
  const [row] = await tx<UserRow[]>`select * from identity.users where lower(email) = ${normaliseEmail(email)}`;
  return row ?? null;
}

async function userById(id: string): Promise<UserRow | null> {
  const [row] = await getSql()<UserRow[]>`select * from identity.users where id = ${id}`;
  return row ?? null;
}

/* ------------------------------------------------------------------ */
/*  One-time codes                                                     */
/* ------------------------------------------------------------------ */

const EMAILS: Record<CodePurpose, (code: string) => { subject: string; text: string }> = {
  "verify-email": (code) => ({
    subject: "Your Roystian Foundation verification code",
    text: `Your verification code is ${code}. It expires in 24 hours.\n\nIf you did not create an account, ignore this email.`,
  }),
  "reset-password": (code) => ({
    subject: "Reset your Roystian Foundation password",
    text: `Your password reset code is ${code}. It expires in 1 hour.\n\nIf you did not ask to reset your password, ignore this email; your password is unchanged.`,
  }),
  "change-email": (code) => ({
    subject: "Confirm your new email address",
    text: `Your code to confirm this email address for your Roystian Foundation account is ${code}. It expires in 1 hour.`,
  }),
};

/** Issues a new code (invalidating earlier ones) and emails it. */
async function issueCode(userId: string, purpose: CodePurpose, to: string): Promise<void> {
  const code = newCode();
  const minutes = CODE_LIFETIME_MINUTES[purpose];
  await getSql().begin(async (tx) => {
    await tx`
      update identity.codes set consumed_at = now()
      where user_id = ${userId} and purpose = ${purpose} and consumed_at is null`;
    await tx`
      insert into identity.codes (user_id, purpose, code_hash, expires_at)
      values (${userId}, ${purpose}, ${hashCode(code)}, now() + make_interval(mins => ${minutes}))`;
  });
  const message = EMAILS[purpose](code);
  await sendEmail(to, message.subject, message.text);
}

/**
 * Checks a code; consumes it on success, counts the attempt on failure.
 * The outcome is committed before any error is raised, so failed attempts
 * always count towards the limit.
 */
async function consumeCode(userId: string, purpose: CodePurpose, code: string): Promise<void> {
  const outcome = await getSql().begin(async (tx) => {
    const [row] = await tx<{ id: string; code_hash: string; attempts: number; expired: boolean }[]>`
      select id, code_hash, attempts, expires_at < now() as expired
      from identity.codes
      where user_id = ${userId} and purpose = ${purpose} and consumed_at is null
      order by created_at desc
      limit 1
      for update`;
    if (!row || row.expired || row.attempts >= MAX_CODE_ATTEMPTS) return "ExpiredCodeException";
    if (!safeEqual(row.code_hash, hashCode(code.trim()))) {
      await tx`update identity.codes set attempts = attempts + 1 where id = ${row.id}`;
      return "CodeMismatchException";
    }
    await tx`update identity.codes set consumed_at = now() where id = ${row.id}`;
    return "ok";
  });
  if (outcome !== "ok") throw authError(outcome);
}

/* ------------------------------------------------------------------ */
/*  Sign-up                                                            */
/* ------------------------------------------------------------------ */

/** Creates an unverified account and emails a verification code. Returns the user id. */
export async function signUp(input: { email: string; password: string }): Promise<string> {
  const email = normaliseEmail(input.email);
  if (!passwordMeetsPolicy(input.password)) throw authError("InvalidPasswordException");
  const passwordHash = await hashPassword(input.password);

  const [created] = await getSql()<{ id: string }[]>`
    insert into identity.users (email, password_hash)
    values (${email}, ${passwordHash})
    on conflict (lower(email)) do nothing
    returning id`;
  if (!created) throw authError("UsernameExistsException");

  try {
    await issueCode(created.id, "verify-email", email);
  } catch (error) {
    await getSql()`delete from identity.users where id = ${created.id}`;
    throw error;
  }
  return created.id;
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const user = await userByEmail(getSql(), email);
  if (!user) throw authError("CodeMismatchException");
  if (user.email_verified_at) throw authError("NotAuthorizedException", "Already confirmed");
  await consumeCode(user.id, "verify-email", code);
  await getSql()`update identity.users set email_verified_at = now() where id = ${user.id}`;
}

export async function resendConfirmation(email: string): Promise<void> {
  const user = await userByEmail(getSql(), email);
  if (!user || user.email_verified_at || user.disabled_at) return;
  await issueCode(user.id, "verify-email", user.email);
}

/** Removes an account whose application records could not be created. */
export async function deleteUser(userId: string): Promise<void> {
  await getSql()`delete from identity.users where id = ${userId}`;
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                           */
/* ------------------------------------------------------------------ */

export interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export async function createSession(userId: string, meta: SessionMeta = {}): Promise<string> {
  const token = newToken();
  await getSql()`
    insert into identity.sessions (user_id, token_hash, expires_at, ip, user_agent)
    values (${userId}, ${hashToken(token)}, now() + make_interval(days => ${SESSION_DAYS}),
            ${meta.ip ?? null}, ${(meta.userAgent ?? "").slice(0, 300) || null})`;
  return token;
}

/**
 * The user behind a session token, or null when the token is unknown,
 * revoked, expired, idle too long, or the account is disabled.
 */
export async function verifySession(token: string | null | undefined): Promise<{ id: string; email: string } | null> {
  if (!token || token.length > 100) return null;
  const [row] = await getSql()<{ id: string; user_id: string; email: string; stale: boolean }[]>`
    select s.id, s.user_id, u.email, s.last_seen_at < now() - interval '5 minutes' as stale
    from identity.sessions s
    join identity.users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)}
      and s.revoked_at is null
      and s.expires_at > now()
      and s.last_seen_at > now() - make_interval(days => ${SESSION_IDLE_DAYS})
      and u.disabled_at is null`;
  if (!row) return null;
  if (row.stale) await getSql()`update identity.sessions set last_seen_at = now() where id = ${row.id}`;
  return { id: row.user_id, email: row.email };
}

export async function revokeSession(token: string): Promise<void> {
  await getSql()`update identity.sessions set revoked_at = now() where token_hash = ${hashToken(token)} and revoked_at is null`;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await getSql()`update identity.sessions set revoked_at = now() where user_id = ${userId} and revoked_at is null`;
}

/* ------------------------------------------------------------------ */
/*  Sign-in                                                            */
/* ------------------------------------------------------------------ */

export type SignInResult = { kind: "session"; token: string; userId: string } | { kind: "mfa"; challenge: string };

export async function signIn(email: string, password: string, meta: SessionMeta = {}): Promise<SignInResult> {
  const user = await userByEmail(getSql(), email);
  if (!user) {
    await burnPasswordCheck(password);
    throw authError("NotAuthorizedException", "Incorrect username or password.");
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await burnPasswordCheck(password);
    throw authError("LimitExceededException", "Too many failed attempts. Try again later.");
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    await getSql()`
      update identity.users
      set failed_logins = case when failed_logins + 1 >= ${MAX_FAILED_LOGINS} then 0 else failed_logins + 1 end,
          locked_until = case when failed_logins + 1 >= ${MAX_FAILED_LOGINS}
                              then now() + make_interval(mins => ${LOCKOUT_MINUTES}) else locked_until end
      where id = ${user.id}`;
    throw authError("NotAuthorizedException", "Incorrect username or password.");
  }

  // Checked only after the password, so these states can't be probed.
  if (user.disabled_at) throw authError("NotAuthorizedException", "User is disabled.");
  if (!user.email_verified_at) throw authError("UserNotConfirmedException");

  await getSql()`update identity.users set failed_logins = 0, locked_until = null where id = ${user.id}`;

  if (user.totp_enabled_at && user.totp_secret) {
    const challenge = newToken();
    await getSql()`
      insert into identity.mfa_challenges (token_hash, user_id, expires_at)
      values (${hashToken(challenge)}, ${user.id}, now() + make_interval(mins => ${MFA_CHALLENGE_MINUTES}))`;
    return { kind: "mfa", challenge };
  }
  return { kind: "session", token: await createSession(user.id, meta), userId: user.id };
}

/** Second step: the authenticator code for a pending challenge. */
export async function answerMfa(challenge: string, code: string, meta: SessionMeta = {}): Promise<{ token: string; userId: string }> {
  const outcome = await getSql().begin(async (tx) => {
    const [row] = await tx<{ user_id: string; attempts: number; expired: boolean }[]>`
      select user_id, attempts, expires_at < now() as expired
      from identity.mfa_challenges where token_hash = ${hashToken(challenge)} for update`;
    if (!row || row.expired || row.attempts >= MAX_CODE_ATTEMPTS) return { error: "ExpiredCodeException" };
    const [user] = await tx<UserRow[]>`select * from identity.users where id = ${row.user_id} for update`;
    if (!user?.totp_secret || user.disabled_at) return { error: "NotAuthorizedException" };

    const step = verifyTotp(decryptSecret(user.totp_secret), code.trim());
    if (step === null || (user.totp_last_step !== null && step <= Number(user.totp_last_step))) {
      await tx`update identity.mfa_challenges set attempts = attempts + 1 where token_hash = ${hashToken(challenge)}`;
      return { error: "CodeMismatchException" };
    }
    await tx`update identity.users set totp_last_step = ${step} where id = ${user.id}`;
    await tx`delete from identity.mfa_challenges where token_hash = ${hashToken(challenge)}`;
    return { userId: user.id };
  });
  if ("error" in outcome) throw authError(outcome.error as string);
  return { token: await createSession(outcome.userId as string, meta), userId: outcome.userId as string };
}

/* ------------------------------------------------------------------ */
/*  Password reset                                                     */
/* ------------------------------------------------------------------ */

export async function forgotPassword(email: string): Promise<void> {
  const user = await userByEmail(getSql(), email);
  if (!user || user.disabled_at) return;
  await issueCode(user.id, "reset-password", user.email);
}

/** Sets a new password and signs the account out everywhere. */
export async function confirmForgotPassword(email: string, code: string, password: string): Promise<void> {
  if (!passwordMeetsPolicy(password)) throw authError("InvalidPasswordException");
  const user = await userByEmail(getSql(), email);
  if (!user || user.disabled_at) throw authError("CodeMismatchException");
  await consumeCode(user.id, "reset-password", code);
  const passwordHash = await hashPassword(password);
  await getSql().begin(async (tx) => {
    // A reset code proves control of the inbox, so the address is verified too.
    await tx`
      update identity.users
      set password_hash = ${passwordHash}, password_changed_at = now(), failed_logins = 0, locked_until = null,
          email_verified_at = coalesce(email_verified_at, now())
      where id = ${user.id}`;
    await tx`update identity.sessions set revoked_at = now() where user_id = ${user.id} and revoked_at is null`;
  });
}

/* ------------------------------------------------------------------ */
/*  Email change                                                       */
/* ------------------------------------------------------------------ */

/** Emails a code to the new address; the current address stays in use until it is confirmed. */
export async function requestEmailChange(userId: string, newEmail: string): Promise<void> {
  const email = normaliseEmail(newEmail);
  if (await userByEmail(getSql(), email)) throw authError("AliasExistsException");
  await getSql()`update identity.users set pending_email = ${email} where id = ${userId}`;
  await issueCode(userId, "change-email", email);
}

/** Confirms the pending address. Returns it. */
export async function confirmEmailChange(userId: string, code: string): Promise<string> {
  const user = await userById(userId);
  if (!user?.pending_email) throw authError("ExpiredCodeException");
  await consumeCode(userId, "change-email", code);
  const email = user.pending_email;
  await getSql().begin(async (tx) => {
    await tx`update identity.users set email = ${email}, pending_email = null where id = ${userId}`;
    await tx`update public.profiles set email = ${email} where id = ${userId}`;
  });
  return email;
}

/* ------------------------------------------------------------------ */
/*  Authenticator app                                                  */
/* ------------------------------------------------------------------ */

/** Stores a new (not yet active) secret and returns it for the QR code. */
export async function startTotpEnrolment(userId: string): Promise<string> {
  const secret = newTotpSecret();
  await getSql()`
    update identity.users set totp_secret = ${encryptSecret(secret)}, totp_enabled_at = null, totp_last_step = null
    where id = ${userId}`;
  return secret;
}

export async function finishTotpEnrolment(userId: string, code: string): Promise<void> {
  const user = await userById(userId);
  if (!user?.totp_secret) throw authError("ExpiredCodeException");
  const step = verifyTotp(decryptSecret(user.totp_secret), code.trim());
  if (step === null) throw authError("CodeMismatchException");
  await getSql()`
    update identity.users set totp_enabled_at = now(), totp_last_step = ${step} where id = ${userId}`;
}

/* ------------------------------------------------------------------ */
/*  Administration                                                     */
/* ------------------------------------------------------------------ */

/** Suspends (and signs out everywhere) or reactivates an account. */
export async function setUserEnabled(userId: string, enabled: boolean): Promise<void> {
  await getSql().begin(async (tx) => {
    await tx`update identity.users set disabled_at = ${enabled ? null : new Date().toISOString()} where id = ${userId}`;
    if (!enabled) await tx`update identity.sessions set revoked_at = now() where user_id = ${userId} and revoked_at is null`;
  });
}
