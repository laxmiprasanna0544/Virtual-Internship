"use client";

const PREFIX = "roystian";

export const STORAGE_KEYS = {
  db: `${PREFIX}.db.v1`,
  session: `${PREFIX}.session.v1`,
  onboarding: `${PREFIX}.onboarding.v1`,
  theme: `${PREFIX}.theme`,
  pendingPayment: `${PREFIX}.pending-payment.v1`,
  completedPayment: `${PREFIX}.completed-payment.v1`,
} as const;

export const DB_EVENT = "roystian:db-changed";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or privacy-mode failures are non-fatal in the demo.
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function notifyChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(DB_EVENT));
}

export function subscribeToChanges(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => listener();
  window.addEventListener(DB_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DB_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
