import "server-only";

import { getDomainAssessments } from "@/data/domains";
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

/**
 * Has the student (auth.uid()) passed every module assessment in `domainId`?
 * The final assessment is closed until they have. Results an admin recorded
 * count, as they do everywhere else.
 */
export async function hasPassedAllModuleAssessments(tx: Tx, domainId: string): Promise<boolean> {
  const required = getDomainAssessments(domainId).map((a) => a.id);
  if (required.length === 0) return false;
  const rows = await tx`
    select distinct assessment_id from public.assessment_attempts
    where student_id = auth.uid() and domain_id = ${domainId} and kind = 'module' and passed
      and assessment_id in ${tx(required)}`;
  return rows.length === required.length;
}

/** The database's own message for an exception raised by a guard trigger. */
export function dbMessage(error: unknown): string {
  return typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
}
