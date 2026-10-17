import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
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

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request.");
  const { certificateId, status, reason } = parsed.data;

  const sql = getSql();
  const rows =
    status === "revoked"
      ? await sql`
          update public.certificates
          set status = 'revoked', revoked_at = now(), revoked_reason = ${reason ?? null}
          where id = ${certificateId} returning id`
      : await sql`
          update public.certificates
          set status = 'valid', revoked_at = null, revoked_reason = null
          where id = ${certificateId} returning id`;
  if (!rows.length) return badRequest("Certificate not found.", 404);

  await audit(ctx, `certificate.${status === "revoked" ? "revoke" : "restore"}`, "certificate", certificateId, {
    reason: reason ?? null,
  });
  return NextResponse.json({ ok: true });
}
