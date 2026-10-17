import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { careerSnapshot } from "@/lib/career-rules";
import { fellowshipEligibility } from "@/lib/opportunity-rules";
import { summariseProgress } from "@/lib/rules";
import { toFellowship, type FellowshipRow } from "@/lib/records/career-mappers";
import { toStudentRecords } from "@/lib/records/mappers";
import { readJson, requireStudent } from "@/lib/server/auth";
import { service } from "@/lib/server/db";
import { fetchStudentRecordRows } from "@/lib/server/student-records";

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
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application." },
      { status: 400 },
    );
  }

  const rows = await service((tx) => fetchStudentRecordRows(tx, userId));
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

  const v = parsed.data;
  try {
    const [row] = await service(
      (tx) => tx<FellowshipRow[]>`
        insert into public.fellowship_applications
          (student_id, stage, readiness_at_apply, motivation, available_from, can_relocate,
           preferred_area, applied_at, updated_at)
        values (${userId}, 'applied', ${readiness.score}, ${v.motivation}, ${v.availableFrom},
                ${v.canRelocate}, ${v.preferredArea}, now(), now())
        on conflict (student_id) do update
        set stage = 'applied', readiness_at_apply = excluded.readiness_at_apply,
            motivation = excluded.motivation, available_from = excluded.available_from,
            can_relocate = excluded.can_relocate, preferred_area = excluded.preferred_area,
            applied_at = now(), updated_at = now()
        returning *`,
    );
    return NextResponse.json({ application: toFellowship(row) });
  } catch (error) {
    console.error("fellowship upsert failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not submit your application." }, { status: 500 });
  }
}
