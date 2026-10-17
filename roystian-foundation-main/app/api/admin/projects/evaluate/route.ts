import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/data/projects";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, canActOnDomain, requireStaff } from "@/lib/server/staff";

const body = z.object({
  submissionId: z.string().uuid(),
  criterionScores: z.record(z.string().max(200), z.number().min(0).max(100)),
  feedback: z.string().trim().max(4000),
});

/**
 * Evaluates a project. The overall score is weighted by the brief's own
 * criteria, computed here rather than accepted from the reviewer's browser.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin", "trainer"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid evaluation.");
  const { submissionId, feedback } = parsed.data;

  const sql = getSql();
  const [submission] = await sql<
    { id: string; student_id: string; project_id: string; domain_id: string; status: string }[]
  >`
    select id, student_id, project_id, domain_id, status
    from public.project_submissions where id = ${submissionId}`;
  if (!submission) return badRequest("Submission not found.", 404);
  if (!canActOnDomain(ctx, submission.domain_id)) return badRequest("Not allowed.", 403);
  if (submission.status !== "submitted" && submission.status !== "evaluated") {
    return badRequest("The student has not submitted this project yet.", 409);
  }

  const brief = getProject(submission.project_id);
  if (!brief) return badRequest("Unknown project brief.");
  const criterionScores = Object.fromEntries(
    brief.evaluationCriteria.map((c) => [c.label, Math.round(parsed.data.criterionScores[c.label] ?? 0)]),
  );
  const overall = Math.round(
    brief.evaluationCriteria.reduce((sum, c) => sum + criterionScores[c.label] * (c.weight / 100), 0),
  );

  await sql`
    update public.project_submissions
    set status = 'evaluated',
        criterion_scores = ${sql.json(criterionScores)},
        overall_score = ${overall},
        feedback = ${feedback || null},
        evaluated_at = now()
    where id = ${submissionId}`;

  await Promise.all([
    notify(
      submission.student_id,
      "assignment",
      "Project evaluated",
      `${brief.title} scored ${overall}/100.`,
      `/dashboard/projects/${brief.id}`,
    ),
    audit(ctx, "project.evaluate", "project_submission", submissionId, { overall }),
  ]);
  return NextResponse.json({ ok: true, overallScore: overall });
}
