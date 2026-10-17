import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.discriminatedUnion("status", [
  z.object({
    applicationId: z.string().uuid(),
    status: z.literal("approved"),
    awardedTier: z.union([z.literal(50), z.literal(75), z.literal(100)]),
  }),
  z.object({ applicationId: z.string().uuid(), status: z.literal("declined") }),
  z.object({ applicationId: z.string().uuid(), status: z.literal("under-review") }),
]);

/** Records a scholarship decision. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid decision.");
  const input = parsed.data;
  const final = input.status === "approved" || input.status === "declined";
  const awardedTier = input.status === "approved" ? input.awardedTier : null;

  const [row] = await getSql()<{ student_id: string }[]>`
    update public.scholarship_applications
    set status = ${input.status},
        awarded_tier = ${awardedTier},
        decided_at = case when ${final}::boolean then now() else null end
    where id = ${input.applicationId}
    returning student_id`;
  if (!row) return badRequest("Application not found.", 404);

  await Promise.all([
    final
      ? notify(
          row.student_id,
          "system",
          input.status === "approved" ? "Scholarship awarded" : "Scholarship decision",
          input.status === "approved"
            ? `You have been awarded a ${awardedTier}% Roystian Skill Scholarship.`
            : "Your scholarship application was not successful this time.",
          "/dashboard/scholarship",
        )
      : Promise.resolve(),
    audit(ctx, "scholarship.decide", "scholarship_application", input.applicationId, {
      status: input.status,
      awardedTier,
    }),
  ]);
  return NextResponse.json({ ok: true });
}
