import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  certificateId: z.string().min(1).max(64),
  status: z.enum(["valid", "revoked"]),
  reason: z.string().trim().max(500).optional(),
});

/** Revokes or restores a certificate. The public verification page follows immediately. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");
  const { certificateId, status, reason } = parsed.data;

  const { data, error } = await ctx.admin
    .from("certificates")
    .update(
      status === "revoked"
        ? { status, revoked_at: new Date().toISOString(), revoked_reason: reason ?? null }
        : { status, revoked_at: null, revoked_reason: null },
    )
    .eq("id", certificateId)
    .select("id")
    .maybeSingle();
  if (error) return badRequest("Could not update the certificate.", 500);
  if (!data) return badRequest("Certificate not found.", 404);

  await audit(ctx, `certificate.${status === "revoked" ? "revoke" : "restore"}`, "certificate", certificateId, {
    reason: reason ?? null,
  });
  return NextResponse.json({ ok: true });
}
