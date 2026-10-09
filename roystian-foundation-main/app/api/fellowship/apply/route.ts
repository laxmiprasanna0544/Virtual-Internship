import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { careerSnapshot } from "@/lib/career-rules";
import { fellowshipEligibility } from "@/lib/opportunity-rules";
import { summariseProgress } from "@/lib/rules";
import { toFellowship } from "@/lib/supabase/career-mappers";
import { toStudentRecords } from "@/lib/supabase/mappers";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchStudentRecordRows } from "@/lib/supabase/student-records";

const body = z.object({
  motivation: z.string().trim().min(20, "Tell us a little more about why.").max(4000),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
  canRelocate: z.boolean(),
  preferredArea: z.string().trim().max(200),
});

/**
 * Fellowship application. Eligibility is re-checked against the database and
 * the readiness score is computed here and frozen on the application, so
 * neither can be supplied by the browser.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdminClient();
  const rows = await fetchStudentRecordRows(admin, user.id);
  if (!rows || rows.profile.role !== "student") {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }
  const records = toStudentRecords(rows);
  const { student, progress, submission, projects, interviews, challenges, certificates } = records;

  if (records.fellowship && records.fellowship.stage !== "eligible") {
    return NextResponse.json({ error: "You have already applied." }, { status: 409 });
  }

  const { readiness } = careerSnapshot({ student, progress, submission, projects, interviews, challenges });
  const summary = summariseProgress(student, progress, submission);
  const eligibility = fellowshipEligibility({
    student,
    certificateIssued: certificates.some((c) => c.domainId === student.domainId && c.status === "valid"),
    assessmentsPassed: summary.assessmentsPassed,
    assessmentTotal: summary.assessmentTotal,
    submission,
    projects,
    challenges,
    readiness,
  });
  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: "You do not meet every eligibility requirement yet." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const { data: row, error } = await admin
    .from("fellowship_applications")
    .upsert(
      {
        student_id: user.id,
        stage: "applied",
        readiness_at_apply: readiness.score,
        motivation: parsed.data.motivation,
        available_from: parsed.data.availableFrom,
        can_relocate: parsed.data.canRelocate,
        preferred_area: parsed.data.preferredArea,
        applied_at: now,
        updated_at: now,
      },
      { onConflict: "student_id" },
    )
    .select("*")
    .single();
  if (error || !row) {
    console.error("fellowship upsert failed:", error?.message);
    return NextResponse.json({ error: "Could not submit your application." }, { status: 500 });
  }

  return NextResponse.json({ application: toFellowship(row) });
}
