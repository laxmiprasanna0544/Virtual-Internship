import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, canActOnDomain, requireStaff } from "@/lib/server/staff";

const body = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["approved", "needs-revision", "reviewed"]),
  feedback: z.string().trim().max(4000),
});

const TITLES = {
  approved: "Practical task approved",
  "needs-revision": "Practical task needs revision",
  reviewed: "Practical task reviewed",
} as const;

/** Admins, and trainers for the submission's domain, review practical tasks. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin", "trainer"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid review.");
  const { submissionId, status, feedback } = parsed.data;

  const sql = getSql();
  const [submission] = await sql<{ id: string; student_id: string; domain_id: string; status: string }[]>`
    select id, student_id, domain_id, status from public.submissions where id = ${submissionId}`;
  if (!submission) return badRequest("Submission not found.", 404);
  if (!canActOnDomain(ctx, submission.domain_id)) return badRequest("Not allowed.", 403);
  if (submission.status === "pending") {
    return badRequest("The student has not submitted this task yet.", 409);
  }

  await sql`
    update public.submissions
    set status = ${status}, feedback = ${feedback || null}, reviewed_by = ${ctx.userId}, reviewed_at = now()
    where id = ${submissionId}`;

  await Promise.all([
    notify(
      submission.student_id,
      "assignment",
      TITLES[status],
      feedback || "Your submission has been reviewed.",
      "/dashboard/assignments",
    ),
    audit(ctx, "submission.review", "submission", submissionId, { status }),
  ]);

  return NextResponse.json({ ok: true });
}
