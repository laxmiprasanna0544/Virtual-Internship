import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssessment } from "@/data/domains";
import { scoreAssessment } from "@/lib/rules";
import { notify } from "@/lib/server/notify";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabase/server";
import { toAttempt } from "@/lib/supabase/mappers";

const body = z.object({
  assessmentId: z.string().min(1).max(200),
  answers: z.record(z.string().max(200), z.array(z.number().int().min(0).max(50)).max(50)),
});

/** Scores an assessment attempt on the server and records it. */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const assessment = getAssessment(parsed.data.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: "Unknown assessment." }, { status: 404 });
  }

  const admin = getSupabaseAdminClient();
  const { data: registration } = await admin
    .from("registrations")
    .select("id")
    .eq("student_id", user.id)
    .eq("domain_id", assessment.domainId)
    .eq("payment_status", "successful")
    .limit(1)
    .maybeSingle();
  if (!registration) {
    return NextResponse.json(
      { error: "You are not enrolled in this domain." },
      { status: 403 },
    );
  }

  // Only answers to questions that exist in this assessment are scored.
  const questionIds = new Set(assessment.questions.map((q) => q.id));
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([id]) => questionIds.has(id)),
  );
  const scored = scoreAssessment(assessment, answers);

  const { data: row, error } = await admin
    .from("assessment_attempts")
    .insert({
      student_id: user.id,
      domain_id: assessment.domainId,
      assessment_id: assessment.id,
      kind: assessment.kind,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      passed: scored.passed,
      answers,
    })
    .select("*")
    .single();
  if (error || !row) {
    console.error("assessment insert failed:", error?.message);
    return NextResponse.json({ error: "Could not record your attempt." }, { status: 500 });
  }

  // Passing a module assessment completes the module, as before.
  if (scored.passed && assessment.kind === "module" && assessment.moduleId) {
    const supabase = await getSupabaseServerClient();
    await supabase.rpc("set_module_complete", {
      target_domain: assessment.domainId,
      target_module: assessment.moduleId,
      complete: true,
    });
  }

  if (scored.passed && assessment.kind === "final") {
    await notify(
      admin,
      user.id,
      "assessment",
      "Final assessment passed",
      `You scored ${scored.percentage}% on the final assessment.`,
      "/dashboard/certificate",
    );
  }

  return NextResponse.json({ attempt: toAttempt(row) });
}
