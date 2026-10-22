"use client";

import type { Certificate } from "@/types";

export type VerificationResult =
  | { status: "valid"; certificate: Certificate }
  | { status: "revoked"; certificate: Certificate }
  | { status: "not-found" };

type PublicCertificate = Pick<
  Certificate,
  "id" | "studentName" | "domainId" | "domainName" | "programId" | "programName" | "duration" | "issueDate" | "status"
>;

/**
 * Public verification. Works for anyone, signed in or not, and returns only
 * the fields printed on the certificate.
 */
export async function verifyCertificatePublic(certificateId: string): Promise<VerificationResult> {
  const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certificateId.trim())}`, {
    cache: "no-store",
  }).catch(() => null);
  if (res?.status === 404) return { status: "not-found" };
  if (!res?.ok) throw new Error("Verification is temporarily unavailable.");
  const { certificate: row } = (await res.json()) as { certificate: PublicCertificate | null };
  if (!row) return { status: "not-found" };
  const certificate: Certificate = { ...row, studentId: "", registrationId: "", finalScore: 0, startDate: null };
  return row.status === "revoked" ? { status: "revoked", certificate } : { status: "valid", certificate };
}

export function verificationUrl(certificateId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/verify/${certificateId}`;
}
