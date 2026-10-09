import { DOMAINS } from "@/data/domains";

export function domainCode(domainId: string | null | undefined): string {
  const match = DOMAINS.find((d) => d.id === domainId);
  return match?.code ?? "GEN";
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/**
 * Registration / certificate IDs follow the documented shape:
 *   RF-<DOMAIN>-<YEAR>-<SEQUENCE>
 * e.g. RF-AIML-2026-000184
 */
export function buildRegistrationId(
  domainId: string | null | undefined,
  sequence: number,
  year = new Date().getFullYear(),
): string {
  return `RF-${domainCode(domainId)}-${year}-${pad(sequence, 6)}`;
}

export function buildCertificateId(
  domainId: string | null | undefined,
  sequence: number,
  year = new Date().getFullYear(),
): string {
  return `RF-${domainCode(domainId)}-${year}-${pad(sequence, 6)}`;
}

let counter = 0;

/** Locally unique id for demo records. */
export function uid(prefix: string): string {
  counter += 1;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${time}${counter.toString(36)}${rand}`;
}

export function buildPaymentId(sequence: number): string {
  return `PAY-${pad(sequence, 7)}`;
}

export function buildPaymentReference(method: string): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${method.toUpperCase()}-${stamp}${rand}`;
}
