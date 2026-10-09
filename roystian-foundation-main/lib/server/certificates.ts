import "server-only";

import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { domainCode } from "@/lib/ids";
import { isCertificateUnlocked } from "@/lib/rules";
import { notify, queueCommunication } from "@/lib/server/notify";
import type { AdminClient } from "@/lib/server/staff";
import { fetchStudentRecordRows } from "@/lib/supabase/student-records";
import { toCertificate, toStudentRecords } from "@/lib/supabase/mappers";
import type { Certificate } from "@/types";

export type IssueResult =
  | { ok: true; certificate: Certificate; created: boolean }
  | { ok: false; status: number; error: string };

/**
 * Issues the certificate for a student's active registration, re-checking
 * every completion rule against the database. Used by the student's own
 * request and by admins; neither can bypass the rules.
 */
export async function issueCertificateFor(
  admin: AdminClient,
  studentId: string,
): Promise<IssueResult> {
  const rows = await fetchStudentRecordRows(admin, studentId);
  if (!rows || rows.profile.role !== "student") {
    return { ok: false, status: 404, error: "Student record not found." };
  }

  const { student, progress, submission, certificates } = toStudentRecords(rows);
  const domain = getDomain(student.domainId);
  const program = getProgram(student.programId);
  if (!domain || !program || !student.registrationId) {
    return { ok: false, status: 400, error: "No active enrolment found." };
  }

  const existing = certificates.find((c) => c.registrationId === student.registrationId);
  if (existing) return { ok: true, certificate: existing, created: false };

  if (!isCertificateUnlocked(student, progress, submission)) {
    return {
      ok: false,
      status: 403,
      error: "Complete every requirement before generating the certificate.",
    };
  }

  const { data: row, error } = await admin.rpc("issue_certificate", {
    p_student_id: studentId,
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
    return { ok: false, status: 500, error: "Could not issue the certificate." };
  }
  const certificate = toCertificate(row);

  await Promise.all([
    notify(
      admin,
      studentId,
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

  return { ok: true, certificate, created: true };
}
