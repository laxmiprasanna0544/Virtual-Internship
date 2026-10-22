import { NextRequest, NextResponse } from "next/server";
import { getAssessmentWithAnswers } from "@/data/assessment-bank";
import { requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { hasPaidForDomain, hasPassedAllModuleAssessments } from "@/lib/server/enrolment";
import type { PublicQuestion } from "@/types";

/**
 * Questions for one assessment, without answers or explanations, for a
 * student enrolled (and paid up) in its domain.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { assessmentId } = await params;
  const assessment = getAssessmentWithAnswers(assessmentId);
  if (!assessment) return NextResponse.json({ error: "Unknown assessment." }, { status: 404 });

  const paid = await withUser(auth.user.id, (tx) => hasPaidForDomain(tx, assessment.domainId));
  if (!paid) {
    return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
  }
  if (
    assessment.kind === "final" &&
    !(await withUser(auth.user.id, (tx) => hasPassedAllModuleAssessments(tx, assessment.domainId)))
  ) {
    return NextResponse.json({ error: "Pass every module assessment to unlock the final assessment." }, { status: 403 });
  }

  const questions: PublicQuestion[] = assessment.questions.map(({ id, type, prompt, options }) => ({
    id,
    type,
    prompt,
    options,
  }));
  return NextResponse.json(
    { questions },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
