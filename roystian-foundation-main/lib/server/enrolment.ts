import "server-only";

import type { Tx } from "@/lib/server/db";

/**
 * Has the student (auth.uid() in this withUser transaction) paid for
 * `domainId`? RLS limits registrations to the student's own rows.
 */
export async function hasPaidForDomain(tx: Tx, domainId: string): Promise<boolean> {
  const rows = await tx`
    select 1 from public.registrations
    where student_id = auth.uid() and domain_id = ${domainId} and payment_status = 'successful'
    limit 1`;
  return rows.length > 0;
}

/** The database's own message for an exception raised by a guard trigger. */
export function dbMessage(error: unknown): string {
  return typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
}
