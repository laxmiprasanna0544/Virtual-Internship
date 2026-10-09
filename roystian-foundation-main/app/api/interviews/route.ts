import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { questionsFor } from "@/data/interviews";
import { evaluateInterview } from "@/lib/interviews";
import { toInterviewSession } from "@/lib/supabase/career-mappers";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";

const body = z.object({
  kind: z.enum(["technical", "hr", "project"]),
  answers: z.record(z.string().max(100), z.string().max(5000)),
});

/**
 * Scores a mock interview on the server and records it. Interview scores
 * feed the communication part of Career Readiness, so they are never taken
 * from the browser.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  const { kind } = parsed.data;

  const admin = getSupabaseAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("domain_id")
    .eq("id", user.id)
    .maybeSingle();
  const domain = getDomain(student?.domain_id);
  if (!student || !domain) {
    return NextResponse.json({ error: "Choose a domain before practising interviews." }, { status: 400 });
  }

  const questionIds = new Set(questionsFor(kind, domain.name).map((q) => q.id));
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([id]) => questionIds.has(id)),
  );
  const feedback = evaluateInterview(kind, domain.name, answers);

  const { data: row, error } = await admin
    .from("interview_sessions")
    .insert({
      student_id: user.id,
      kind,
      domain_id: domain.id,
      answers,
      scores: { ...feedback.scores },
      overall_score: feedback.overallScore,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    })
    .select("*")
    .single();
  if (error || !row) {
    console.error("interview insert failed:", error?.message);
    return NextResponse.json({ error: "Could not save the session." }, { status: 500 });
  }

  return NextResponse.json({ session: toInterviewSession(row), feedback });
}
