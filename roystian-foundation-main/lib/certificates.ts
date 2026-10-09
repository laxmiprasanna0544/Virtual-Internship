"use client";

import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getDB, updateDB } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildCertificateId } from "@/lib/ids";
import { runCompletionFlow } from "@/lib/communications";
import { pushNotification } from "@/lib/notifications";
import {
  getProgress,
  getSubmission,
  isCertificateUnlocked,
} from "@/lib/progress";
import type { Certificate, Student } from "@/types";

export function listCertificates(): Certificate[] {
  return [...getDB().certificates].sort((a, b) =>
    a.issueDate < b.issueDate ? 1 : -1,
  );
}

export function getCertificateForStudent(
  studentId: string | null | undefined,
  domainId?: string | null | undefined,
): Certificate | null {
  if (!studentId) return null;
  if (domainId) {
    return (
      getDB().certificates.find(
        (c) => c.studentId === studentId && c.domainId === domainId,
      ) ?? null
    );
  }
  return getDB().certificates.find((c) => c.studentId === studentId) ?? null;
}

export type VerificationResult =
  | { status: "valid"; certificate: Certificate }
  | { status: "revoked"; certificate: Certificate }
  | { status: "not-found" };

/**
 * Public verification against Supabase. Works for anyone, signed in or not,
 * and returns only the fields printed on the certificate.
 */
export async function verifyCertificatePublic(
  certificateId: string,
): Promise<VerificationResult> {
  const { data, error } = await getSupabaseBrowserClient().rpc("verify_certificate", {
    certificate_id: certificateId,
  });
  if (error) throw new Error("Verification is temporarily unavailable.");
  const row = data?.[0];
  if (!row) return { status: "not-found" };
  const certificate: Certificate = {
    id: row.id,
    studentId: "",
    studentName: row.student_name,
    domainId: row.domain_id,
    domainName: row.domain_name,
    programId: row.program_id,
    programName: row.program_name,
    duration: row.duration,
    issueDate: row.issue_date,
    status: row.status,
    registrationId: "",
    finalScore: 0,
  };
  return row.status === "revoked"
    ? { status: "revoked", certificate }
    : { status: "valid", certificate };
}

export function verifyCertificate(certificateId: string): VerificationResult {
  const id = certificateId.trim().toUpperCase();
  const certificate = getDB().certificates.find(
    (c) => c.id.toUpperCase() === id,
  );
  if (!certificate) return { status: "not-found" };
  return certificate.status === "revoked"
    ? { status: "revoked", certificate }
    : { status: "valid", certificate };
}

/**
 * Issues a certificate for a student. Returns null when the completion
 * requirements have not been satisfied — the certificate is never available
 * simply because a payment succeeded.
 */
export function generateCertificate(student: Student): Certificate | null {
  const existing = getCertificateForStudent(student.id, student.domainId);
  if (existing) return existing;

  const progress = getProgress(student.id, student.domainId);
  const submission = getSubmission(student.id, student.domainId);
  if (!isCertificateUnlocked(student, progress, submission)) return null;

  const domain = getDomain(student.domainId);
  const program = getProgram(student.programId);
  if (!domain || !program) return null;

  const db = getDB();
  const sequence = db.counters.certificate + 37;

  const certificate: Certificate = {
    id: buildCertificateId(domain.id, sequence),
    studentId: student.id,
    studentName: student.name,
    domainId: domain.id,
    domainName: domain.name,
    programId: program.id,
    programName: program.name,
    duration: "15 Days",
    issueDate: new Date().toISOString(),
    status: "valid",
    registrationId: student.registrationId ?? "—",
    finalScore: progress?.finalAttempt?.percentage ?? 0,
  };

  updateDB((next) => {
    next.certificates = [certificate, ...next.certificates];
    next.counters = { ...next.counters, certificate: sequence };
    next.students = next.students.map((s) =>
      s.id === student.id ? { ...s, status: "completed" } : s,
    );
    next.registrations = next.registrations.map((r) =>
      r.studentId === student.id && r.domainId === student.domainId
        ? { ...r, internshipStatus: "certified" }
        : r,
    );
  });

  runCompletionFlow({
    name: student.name,
    email: student.email,
    certificateId: certificate.id,
    domainName: domain.name,
    pehlaChance: program.pehlaChanceIncluded,
  });

  pushNotification(
    student.id,
    "certificate",
    "Certificate unlocked",
    `Your ${domain.name} internship certificate ${certificate.id} is ready to download.`,
    "/dashboard/certificate",
  );

  return certificate;
}

export function setCertificateStatus(
  certificateId: string,
  status: Certificate["status"],
): void {
  updateDB((db) => {
    db.certificates = db.certificates.map((c) =>
      c.id === certificateId ? { ...c, status } : c,
    );
  });
}

export function verificationUrl(certificateId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/verify/${certificateId}`;
}
