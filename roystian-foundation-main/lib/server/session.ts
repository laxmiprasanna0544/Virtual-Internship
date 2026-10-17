import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { SESSION_DAYS, verifySession, type SessionMeta } from "@/lib/server/identity";
import { clientIp } from "@/lib/server/rate-limit";

/**
 * Session cookies. The session is an opaque random token; only its SHA-256
 * hash is stored (identity.sessions), so it can be revoked at any time.
 * Browser JavaScript never sees it (httpOnly).
 *
 *   rf_session  the session token (30 days, also expires after 7 idle days)
 *   rf_mfa      a pending two-factor challenge (5 minutes)
 */
export const SESSION_COOKIE = "rf_session";
export const MFA_COOKIE = "rf_mfa";

export function secureCookies(): boolean {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
}

function baseCookie() {
  return { httpOnly: true, secure: secureCookies(), sameSite: "lax" as const, path: "/" };
}

export interface SessionUser {
  id: string;
  email: string;
}

type CookieTarget = Pick<NextResponse["cookies"], "set">;

export function setSessionCookie(target: CookieTarget, token: string): void {
  target.set(SESSION_COOKIE, token, { ...baseCookie(), maxAge: SESSION_DAYS * 24 * 60 * 60 });
  target.set(MFA_COOKIE, "", { ...baseCookie(), maxAge: 0 });
}

export function clearSessionCookies(target: CookieTarget): void {
  for (const name of [SESSION_COOKIE, MFA_COOKIE]) target.set(name, "", { ...baseCookie(), maxAge: 0 });
}

export function setMfaCookie(target: CookieTarget, challenge: string): void {
  target.set(MFA_COOKIE, challenge, { ...baseCookie(), maxAge: 5 * 60 });
}

/** Who is making the request, recorded on new sessions. */
export function sessionMeta(req: NextRequest): SessionMeta {
  return { ip: clientIp(req), userAgent: req.headers.get("user-agent") };
}

/** The verified signed-in user for this request, or null. */
export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** The raw session token (for signing out this session). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
