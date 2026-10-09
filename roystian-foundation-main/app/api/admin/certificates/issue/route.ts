import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueCertificateFor } from "@/lib/server/certificates";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({ studentId: z.string().uuid() });

/** Admin-triggered issue. The completion rules still apply — this is not an override. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");

  const result = await issueCertificateFor(ctx.admin, parsed.data.studentId);
  if (!result.ok) return badRequest(result.error, result.status);

  if (result.created) {
    await audit(ctx, "certificate.issue", "certificate", result.certificate.id, {
      studentId: parsed.data.studentId,
    });
  }
  return NextResponse.json({ certificate: result.certificate });
}
