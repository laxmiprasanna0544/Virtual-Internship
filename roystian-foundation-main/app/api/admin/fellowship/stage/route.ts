import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FELLOWSHIP_STAGE_LABEL } from "@/data/opportunities";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
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

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid stage.");
  const { applicationId, stage } = parsed.data;

  const [row] = await getSql()<{ student_id: string }[]>`
    update public.fellowship_applications
    set stage = ${stage}, updated_at = now()
    where id = ${applicationId}
    returning student_id`;
  if (!row) return badRequest("Application not found.", 404);

  await Promise.all([
    notify(
      row.student_id,
      "system",
      "Fellowship application update",
      `Your application status is now: ${FELLOWSHIP_STAGE_LABEL[stage] ?? stage}.`,
      "/dashboard/fellowship",
    ),
    audit(ctx, "fellowship.stage", "fellowship_application", applicationId, { stage }),
  ]);
  return NextResponse.json({ ok: true });
}
