import "server-only";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Transactional email.
 *
 *   RESEND_API_KEY + EMAIL_FROM   send through Resend (production)
 *   EMAIL_LOG_ONLY=true           write messages to the app log instead —
 *                                 for a test deployment without a provider.
 *                                 Sign-in codes appear in the log, so never
 *                                 enable this where real users sign up.
 *   EMAIL_OUTBOX_DIR=<path>       also write each message as JSON to this
 *                                 folder (local automated tests only)
 *
 * With none of these, sending fails: sign-up and password reset refuse
 * rather than silently dropping the code.
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email delivery is not configured");
    this.name = "EmailNotConfiguredError";
  }
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) || logOnly() || Boolean(process.env.EMAIL_OUTBOX_DIR);
}

const logOnly = () => process.env.EMAIL_LOG_ONLY === "true";

function writeOutbox(to: string, subject: string, text: string, id: string) {
  const dir = process.env.EMAIL_OUTBOX_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${Date.now()}-${id}.json`), JSON.stringify({ id, to, subject, text, at: new Date().toISOString() }));
}

/** Sends a plain-text email. Returns the provider's message id. */
export async function sendEmail(to: string, subject: string, text: string): Promise<string> {
  const id = randomUUID();
  writeOutbox(to, subject, text, id);

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": id },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw Object.assign(new Error(`Resend responded ${res.status}`), { name: "EmailSendError" });
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return data.id ?? id;
  }

  if (logOnly()) {
    console.log(`[email:log-only] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
    return `log-${id}`;
  }
  if (process.env.EMAIL_OUTBOX_DIR) return `outbox-${id}`;
  throw new EmailNotConfiguredError();
}
