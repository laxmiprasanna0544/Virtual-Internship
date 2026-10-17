"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { EducationLevel, Student, User } from "@/types";

/**
 * Client side of authentication. Sign-in, sign-up and every account change
 * go through /api/auth/* and /api/me/*, which keep
 * the tokens in httpOnly cookies. The browser only ever learns who is signed
 * in, never the tokens. middleware.ts enforces access on the server.
 */

export interface SessionState {
  ready: boolean;
  user: User | Student | null;
  student: Student | null;
  mfaEnabled: boolean;
}

/** Detail of the window "rf-session" event dispatched on every session change. */
export interface SessionEventDetail {
  signedIn: boolean;
}

/** True when an "rf-session" event announces a sign-out. */
export function isSignOutEvent(event: Event): boolean {
  return (event as CustomEvent<SessionEventDetail>).detail?.signedIn === false;
}

let state: SessionState = { ready: false, user: null, student: null, mfaEnabled: false };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function setState(user: User | Student | null, mfaEnabled = false) {
  state = {
    ready: true,
    user,
    student: user && user.role === "student" ? (user as Student) : null,
    mfaEnabled,
  };
  listeners.forEach((listener) => listener());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<SessionEventDetail>("rf-session", { detail: { signedIn: Boolean(user) } }));
  }
}

/** Re-reads the session from the server. Concurrent calls share a request. */
export function refreshSession(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetch("/api/auth/session", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { user: null }))
    .then((data: { user: User | Student | null; mfaEnabled?: boolean }) =>
      setState(data.user ?? null, Boolean(data.mfaEnabled)),
    )
    .catch(() => setState(null))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSession(): SessionState {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (!state.ready) void refreshSession();
  }, []);
  return snapshot;
}

async function post<T>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

/* ------------------------------------------------------------------ */
/*  Sign-in                                                            */
/* ------------------------------------------------------------------ */

export interface LoginResult {
  ok: boolean;
  error?: string;
  user?: User | Student;
  /** A code from the authenticator app is needed (call submitMfaCode). */
  mfaRequired?: boolean;
  /** Staff account without two-factor yet: send them to /account/security. */
  mfaSetupRequired?: boolean;
  /** The email address has not been confirmed yet. */
  needsConfirmation?: boolean;
}

type LoginResponse = {
  ok?: boolean;
  user?: User | Student;
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  needsConfirmation?: boolean;
};

function loginResult(ok: boolean, data: LoginResponse & { error?: string }): LoginResult {
  if (data.mfaRequired) return { ok: false, mfaRequired: true };
  if (!ok || !data.user) {
    return { ok: false, error: data.error ?? "Unable to sign in.", needsConfirmation: data.needsConfirmation };
  }
  setState(data.user, !data.mfaSetupRequired);
  return { ok: true, user: data.user, mfaSetupRequired: data.mfaSetupRequired };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { ok, data } = await post<LoginResponse>("/api/auth/login", { email, password });
  return loginResult(ok, data);
}

export async function submitMfaCode(code: string): Promise<LoginResult> {
  const { ok, data } = await post<LoginResponse>("/api/auth/mfa", { code });
  return loginResult(ok, data);
}

export async function logout(): Promise<void> {
  await post("/api/auth/logout", {}).catch(() => undefined);
  setState(null);
}

/* ------------------------------------------------------------------ */
/*  Sign-up                                                            */
/* ------------------------------------------------------------------ */

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  college?: string;
  course?: string;
  city?: string;
  educationLevel?: Student["educationLevel"];
}

export async function registerStudent(
  input: RegisterInput,
): Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }> {
  const { ok, data } = await post<{ needsConfirmation?: boolean }>("/api/auth/signup", input);
  return ok ? { ok: true, needsConfirmation: data.needsConfirmation ?? true } : { ok: false, error: data.error };
}

export async function confirmSignup(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await post("/api/auth/confirm", { email, code });
  return ok ? { ok: true } : { ok: false, error: data.error ?? "Unable to confirm the account." };
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await post("/api/auth/resend", { email });
}

/* ------------------------------------------------------------------ */
/*  Password reset                                                     */
/* ------------------------------------------------------------------ */

/** Emails a reset code. Always succeeds, so accounts cannot be discovered. */
export async function requestPasswordReset(email: string): Promise<void> {
  await post("/api/auth/forgot", { email });
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await post("/api/auth/reset", { email, code, password });
  return ok ? { ok: true } : { ok: false, error: data.error ?? "Could not reset the password." };
}

/* ------------------------------------------------------------------ */
/*  Profile and email                                                  */
/* ------------------------------------------------------------------ */

export interface ProfileUpdate {
  name: string;
  email: string;
  mobile: string;
  college: string;
  course: string;
  city: string;
  educationLevel: EducationLevel;
}

/**
 * Saves the signed-in student's own details. An email change is not applied
 * here: it starts the verification (a code goes to the new address) and
 * completes with confirmEmailChange().
 */
export async function updateOwnProfile(
  values: ProfileUpdate,
): Promise<{ ok: boolean; error?: string; emailChangePending?: boolean }> {
  const { ok, data } = await post<{ user?: Student }>("/api/me/profile", values);
  if (!ok) return { ok: false, error: data.error ?? "Unable to save your profile. Please try again." };

  let emailChangePending = false;
  const current = state.user?.email?.toLowerCase();
  const next = values.email.trim().toLowerCase();
  if (current && next !== current) {
    const change = await post("/api/me/email", { email: next });
    if (!change.ok) {
      return { ok: false, error: change.data.error ?? "Profile saved, but the email address could not be changed." };
    }
    emailChangePending = true;
  }
  await refreshSession();
  return { ok: true, emailChangePending };
}

export async function confirmEmailChange(code: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await post("/api/me/email/confirm", { code });
  if (ok) await refreshSession();
  return ok ? { ok: true } : { ok: false, error: data.error ?? "That code is not valid." };
}

/* ------------------------------------------------------------------ */
/*  Two-factor authentication                                          */
/* ------------------------------------------------------------------ */

export async function startMfaSetup(): Promise<{ ok: boolean; secret?: string; otpauth?: string; error?: string }> {
  const { ok, data } = await post<{ secret?: string; otpauth?: string }>("/api/auth/mfa/setup", {});
  return ok ? { ok: true, secret: data.secret, otpauth: data.otpauth } : { ok: false, error: data.error };
}

export async function enableMfa(code: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await post("/api/auth/mfa/enable", { code });
  if (ok) await refreshSession();
  return ok ? { ok: true } : { ok: false, error: data.error ?? "That code is not correct." };
}
