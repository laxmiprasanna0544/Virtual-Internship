import "server-only";

import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { domainCode } from "@/lib/ids";
import { isCertificateUnlocked } from "@/lib/rules";
import { service } from "@/lib/server/db";
import { notify, sendCommunication } from "@/lib/server/notify";
import { fetchStudentRecordRows } from "@/lib/server/student-records";
import { toCertificate, toStudentRecords, type CertificateRow } from "@/lib/records/mappers";
import type { Certificate } from "@/types";

export type IssueResult =
  | { ok: true; certificate: Certificate; created: boolean }
  | { ok: false; status: number; error: string };

/**
 * Issues the certificate for a student's active registration, re-checking
 * every completion rule against the database. Used by the student's own
 * request and by admins; neither can bypass the rules.
 */
export async function issueCertificateFor(studentId: string): Promise<IssueResult> {
  const rows = await service((tx) => fetchStudentRecordRows(tx, studentId));
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

  let row: CertificateRow | undefined;
  try {
    [row] = await service(
      (tx) => tx<CertificateRow[]>`
        select * from public.issue_certificate(
          ${studentId}, ${student.registrationId}, ${domainCode(domain.id)}, ${student.name},
          ${domain.name}, ${program.name}, ${"15 Days"}, ${progress?.finalAttempt?.percentage ?? 0})`,
    );
  } catch (error) {
    console.error("issue_certificate failed:", error instanceof Error ? error.message : error);
  }
  if (!row) return { ok: false, status: 500, error: "Could not issue the certificate." };
  const certificate = toCertificate(row);

  await Promise.all([
    notify(
      studentId,
      "certificate",
      "Certificate unlocked",
      `Your ${domain.name} internship certificate ${certificate.id} is ready to download.`,
      "/dashboard/certificate",
    ),
    sendCommunication({
      event: "program-completed",
      recipient: student.email,
      subject: "Your Roystian internship certificate is ready",
      body: `Congratulations ${student.name.split(" ")[0]}, certificate ${certificate.id} has been issued and can be verified publicly.`,
    }),
  ]);

  return { ok: true, certificate, created: true };
}
