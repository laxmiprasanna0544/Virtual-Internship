import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FELLOWSHIP_STAGE_LABEL } from "@/data/opportunities";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  applicationId: z.string().uuid(),
  stage: z.enum(["applied", "shortlisted", "interview", "selected", "not-selected"]),
});

/** Moves a fellowship application through selection. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid stage.");
  const { applicationId, stage } = parsed.data;

  const { data, error } = await ctx.admin
    .from("fellowship_applications")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .select("student_id")
    .maybeSingle();
  if (error) return badRequest("Could not update the application.", 500);
  if (!data) return badRequest("Application not found.", 404);

  await Promise.all([
    notify(
      ctx.admin,
      data.student_id,
      "system",
      "Fellowship application update",
      `Your application status is now: ${FELLOWSHIP_STAGE_LABEL[stage] ?? stage}.`,
      "/dashboard/fellowship",
    ),
    audit(ctx, "fellowship.stage", "fellowship_application", applicationId, { stage }),
  ]);
  return NextResponse.json({ ok: true });
}
