import "server-only";

import { NextResponse } from "next/server";
import type { Json } from "@/types/db";
import type { Role } from "@/types";
import { getSql } from "@/lib/server/db";
import { getAuthenticatedUser } from "@/lib/server/session";

export interface StaffContext {
  userId: string;
  role: Role;
  /** Trainer domains; empty for admins (who are unrestricted). */
  trainerDomains: string[];
}

/** Staff must have an authenticator app enrolled before using staff APIs. */
export function staffMfaRequired(): boolean {
  return process.env.STAFF_MFA_REQUIRED !== "false";
}

/**
 * Verifies the caller is signed in with one of `roles`. Returns the context,
 * or a ready-made error response for the route to return.
 */
export async function requireStaff(
  roles: Role[],
): Promise<{ ok: true; ctx: StaffContext } | { ok: false; response: NextResponse }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  }

  const sql = getSql();
  const [profile] = await sql<{ role: Role; mfa_enabled: boolean }[]>`
    select role, mfa_enabled from public.profiles where id = ${user.id}`;
  if (!profile || !roles.includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: "Not allowed." }, { status: 403 }) };
  }
  if (profile.role !== "student" && staffMfaRequired() && !profile.mfa_enabled) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Set up two-factor authentication before using staff tools.", code: "mfa_required" },
        { status: 403 },
      ),
    };
  }

  let trainerDomains: string[] = [];
  if (profile.role === "trainer") {
    const [trainer] = await sql<{ domains: string[] }[]>`
      select domains from public.trainers where profile_id = ${user.id}`;
    trainerDomains = trainer?.domains ?? [];
  }

  return { ok: true, ctx: { userId: user.id, role: profile.role, trainerDomains } };
}

/** May this staff member act on records in `domainId`? */
export function canActOnDomain(ctx: StaffContext, domainId: string): boolean {
  return ctx.role === "admin" || ctx.trainerDomains.includes(domainId);
}

export async function audit(
  ctx: StaffContext,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, Json> = {},
) {
  try {
    await getSql()`
      insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
      values (${ctx.userId}, ${action}, ${targetType}, ${targetId}, ${getSql().json(details)})`;
  } catch (error) {
    console.error("audit log write failed:", error instanceof Error ? error.message : error);
  }
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
