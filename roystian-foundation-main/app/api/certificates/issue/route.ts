import { NextResponse } from "next/server";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { domainCode } from "@/lib/ids";
import { isCertificateUnlocked } from "@/lib/rules";
import { notify, queueCommunication } from "@/lib/server/notify";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchStudentRecordRows } from "@/lib/supabase/student-records";
import { toCertificate, toStudentRecords } from "@/lib/supabase/mappers";

/**
 * Issues the certificate for the student's active registration. The
 * completion rules are re-checked here against the database — the client's
 * view of progress is never trusted.
 */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const admin = getSupabaseAdminClient();
  const rows = await fetchStudentRecordRows(admin, user.id);
  if (!rows || rows.profile.role !== "student") {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }

  const { student, progress, submission, certificates } = toStudentRecords(rows);
  const domain = getDomain(student.domainId);
  const program = getProgram(student.programId);
  if (!domain || !program || !student.registrationId) {
    return NextResponse.json({ error: "No active enrolment found." }, { status: 400 });
  }

  const existing = certificates.find((c) => c.registrationId === student.registrationId);
  if (existing) return NextResponse.json({ certificate: existing });

  if (!isCertificateUnlocked(student, progress, submission)) {
    return NextResponse.json(
      { error: "Complete every requirement before generating your certificate." },
      { status: 403 },
    );
  }

  const { data: row, error } = await admin.rpc("issue_certificate", {
    p_student_id: user.id,
    p_registration_id: student.registrationId,
    p_domain_code: domainCode(domain.id),
    p_student_name: student.name,
    p_domain_name: domain.name,
    p_program_name: program.name,
    p_duration: "15 Days",
    p_final_score: progress?.finalAttempt?.percentage ?? 0,
  });
  if (error || !row) {
    console.error("issue_certificate failed:", error?.message);
    return NextResponse.json({ error: "Could not issue the certificate." }, { status: 500 });
  }
  const certificate = toCertificate(row);

  await Promise.all([
    notify(
      admin,
      user.id,
      "certificate",
      "Certificate unlocked",
      `Your ${domain.name} internship certificate ${certificate.id} is ready to download.`,
      "/dashboard/certificate",
    ),
    queueCommunication(admin, {
      event: "program-completed",
      channel: "email",
      recipient: student.email,
      subject: "Your Roystian internship certificate is ready",
      body: `Congratulations ${student.name.split(" ")[0]}, certificate ${certificate.id} has been issued and can be verified publicly.`,
    }),
  ]);

  return NextResponse.json({ certificate });
}
