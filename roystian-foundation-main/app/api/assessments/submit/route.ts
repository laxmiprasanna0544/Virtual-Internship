import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssessmentWithAnswers } from "@/data/assessment-bank";
import { scoreAssessment } from "@/lib/rules";
import { readJson, requireStudent } from "@/lib/server/auth";
import { getSql, withUser } from "@/lib/server/db";
import { hasPaidForDomain, hasPassedAllModuleAssessments } from "@/lib/server/enrolment";
import { notify } from "@/lib/server/notify";
import { toAttempt, type AttemptRow } from "@/lib/records/mappers";
import type { QuestionReview } from "@/types";

/** Attempts allowed per assessment in any rolling 24 hours. */
const MAX_ATTEMPTS_PER_DAY = 5;

const body = z.object({
  assessmentId: z.string().min(1).max(200),
  answers: z.record(z.string().max(200), z.array(z.number().int().min(0).max(50)).max(50)),
});

/** Scores an assessment attempt on the server and records it. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const assessment = getAssessmentWithAnswers(parsed.data.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: "Unknown assessment." }, { status: 404 });
  }

  const sql = getSql();
  const paid = await withUser(userId, (tx) => hasPaidForDomain(tx, assessment.domainId));
  if (!paid) {
    return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
  }
  if (
    assessment.kind === "final" &&
    !(await withUser(userId, (tx) => hasPassedAllModuleAssessments(tx, assessment.domainId)))
  ) {
    return NextResponse.json({ error: "Pass every module assessment to unlock the final assessment." }, { status: 403 });
  }

  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from public.assessment_attempts
    where student_id = ${userId} and assessment_id = ${assessment.id}
      and overridden_by is null and submitted_at > now() - interval '24 hours'`;
  if (count >= MAX_ATTEMPTS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have used all ${MAX_ATTEMPTS_PER_DAY} attempts for this assessment in the last 24 hours. Review the module and try again tomorrow.`,
        attemptsRemaining: 0,
      },
      { status: 429 },
    );
  }

  // Only answers to questions that exist in this assessment are scored.
  const questionIds = new Set(assessment.questions.map((q) => q.id));
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([id]) => questionIds.has(id)),
  );
  const scored = scoreAssessment(assessment, answers);

  let row: AttemptRow;
  try {
    [row] = await sql<AttemptRow[]>`
      insert into public.assessment_attempts
        (student_id, domain_id, assessment_id, kind, score, total, percentage, passed, answers)
      values (${userId}, ${assessment.domainId}, ${assessment.id}, ${assessment.kind}, ${scored.score},
              ${scored.total}, ${scored.percentage}, ${scored.passed}, ${sql.json(answers)})
      returning *`;
  } catch (error) {
    console.error("assessment insert failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not record your attempt." }, { status: 500 });
  }

  // Passing a module assessment completes the module.
  if (scored.passed && assessment.kind === "module" && assessment.moduleId) {
    await withUser(userId, (tx) =>
      tx`select public.set_module_complete(${assessment.domainId}, ${assessment.moduleId!}, true)`,
    );
  }

  if (scored.passed && assessment.kind === "final") {
    await notify(
      userId,
      "assessment",
      "Final assessment passed",
      `You scored ${scored.percentage}% on the final assessment.`,
      "/dashboard/certificate",
    );
  }

  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS_PER_DAY - count - 1);

  // A failed attempt reveals only the score: no per-question right/wrong,
  // so answers cannot be worked out by retrying. A pass shows the full review.
  const review: QuestionReview[] = scored.passed
    ? assessment.questions.map((question) => {
        const given = [...(answers[question.id] ?? [])].sort((a, b) => a - b);
        const expected = [...question.correct].sort((a, b) => a - b);
        const correct =
          given.length === expected.length && given.every((value, i) => value === expected[i]);
        return {
          questionId: question.id,
          correct,
          correctOptions: question.correct,
          explanation: question.explanation,
        };
      })
    : [];

  return NextResponse.json({ attempt: toAttempt(row), review, attemptsRemaining });
}
