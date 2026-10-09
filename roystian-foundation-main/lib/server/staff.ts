import "server-only";

import { NextResponse } from "next/server";
import type { Json } from "@/types/supabase";
import type { Role } from "@/types";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export interface StaffContext {
  userId: string;
  role: Role;
  /** Trainer domains; empty for admins (who are unrestricted). */
  trainerDomains: string[];
  admin: AdminClient;
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

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !roles.includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: "Not allowed." }, { status: 403 }) };
  }

  let trainerDomains: string[] = [];
  if (profile.role === "trainer") {
    const { data: trainer } = await admin
      .from("trainers")
      .select("domains")
      .eq("profile_id", user.id)
      .maybeSingle();
    trainerDomains = trainer?.domains ?? [];
  }

  return { ok: true, ctx: { userId: user.id, role: profile.role, trainerDomains, admin } };
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
  const { error } = await ctx.admin.from("admin_audit_log").insert({
    actor_id: ctx.userId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
  if (error) console.error("audit log write failed:", error.message);
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
