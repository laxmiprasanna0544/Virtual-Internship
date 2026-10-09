import { NextRequest, NextResponse } from "next/server";
import { getAssessmentWithAnswers } from "@/data/assessment-bank";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import type { PublicQuestion } from "@/types";

/**
 * Questions for one assessment, without answers or explanations, for a
 * student enrolled (and paid up) in its domain.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const { assessmentId } = await params;
  const assessment = getAssessmentWithAnswers(assessmentId);
  if (!assessment) return NextResponse.json({ error: "Unknown assessment." }, { status: 404 });

  const { data: registration } = await getSupabaseAdminClient()
    .from("registrations")
    .select("id")
    .eq("student_id", user.id)
    .eq("domain_id", assessment.domainId)
    .eq("payment_status", "successful")
    .limit(1)
    .maybeSingle();
  if (!registration) {
    return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
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
