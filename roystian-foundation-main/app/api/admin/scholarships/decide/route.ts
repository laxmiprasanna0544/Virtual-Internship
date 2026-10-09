import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid decision.");
  const input = parsed.data;
  const final = input.status === "approved" || input.status === "declined";

  const { data, error } = await ctx.admin
    .from("scholarship_applications")
    .update({
      status: input.status,
      awarded_tier: input.status === "approved" ? input.awardedTier : null,
      decided_at: final ? new Date().toISOString() : null,
    })
    .eq("id", input.applicationId)
    .select("student_id")
    .maybeSingle();
  if (error) return badRequest("Could not record the decision.", 500);
  if (!data) return badRequest("Application not found.", 404);

  await Promise.all([
    final
      ? notify(
          ctx.admin,
          data.student_id,
          "system",
          input.status === "approved" ? "Scholarship awarded" : "Scholarship decision",
          input.status === "approved"
            ? `You have been awarded a ${input.awardedTier}% Roystian Skill Scholarship.`
            : "Your scholarship application was not successful this time.",
          "/dashboard/scholarship",
        )
      : Promise.resolve(),
    audit(ctx, "scholarship.decide", "scholarship_application", input.applicationId, {
      status: input.status,
      awardedTier: input.status === "approved" ? input.awardedTier : null,
    }),
  ]);
  return NextResponse.json({ ok: true });
}
