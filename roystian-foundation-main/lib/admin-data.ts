"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { AdminData } from "@/lib/records/admin";
import type { Certificate, CollegeLead, FellowshipStage, ScholarshipTier } from "@/types";

/**
 * Staff console data (GET /api/admin/data), shared by every admin, trainer and
 * campus screen in the tab. The server loads it under the caller's own row
 * level security.
 * Mutations go through /api/admin/* (role-checked and audited on the server)
 * and refresh this store when they succeed.
 */

interface AdminState {
  status: "idle" | "loading" | "ready" | "error";
  data: AdminData | null;
  error: string | null;
}

let state: AdminState = { status: "idle", data: null, error: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function setState(next: AdminState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshAdminData(): Promise<void> {
  if (inflight) return inflight;
  if (state.status === "idle") setState({ ...state, status: "loading" });
  inflight = fetch("/api/admin/data", { cache: "no-store" })
    .then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Unable to load admin data.");
      }
      return body.data as AdminData;
    })
    .then((data) => setState({ status: "ready", data, error: null }))
    .catch((error) =>
      setState({
        ...state,
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load admin data.",
      }),
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** The admin dataset, or null until the first load finishes. */
export function useAdminData(): AdminData | null {
  return useAdminState().data;
}

export function useAdminState(): AdminState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);

  useEffect(() => {
    if (state.status === "idle") void refreshAdminData();
    // lib/auth.ts announces session changes; drop staff data on sign-out.
    const onSession = () => {
      void fetch("/api/auth/session", { cache: "no-store" })
        .then((res) => res.json())
        .then((body) => {
          if (!body?.user) setState({ status: "idle", data: null, error: null });
        })
        .catch(() => undefined);
    };
    const onFocus = () => void refreshAdminData();
    window.addEventListener("rf-session", onSession);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("rf-session", onSession);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return snapshot;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

async function adminPost<T = { ok: true }>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "The action failed.");
  }
  await refreshAdminData();
  return data as T;
}

export const reviewSubmission = (
  submissionId: string,
  status: "approved" | "needs-revision" | "reviewed",
  feedback: string,
) => adminPost("submissions/review", { submissionId, status, feedback });

export const setCertificateStatus = (
  certificateId: string,
  status: Certificate["status"],
  reason?: string,
) => adminPost("certificates/status", { certificateId, status, reason });

export const issueCertificate = (studentId: string) =>
  adminPost<{ certificate: Certificate }>("certificates/issue", { studentId });

export const refundPayment = (paymentId: string) => adminPost("payments/refund", { paymentId });

export const setStudentStatus = (studentId: string, status: "active" | "suspended") =>
  adminPost("students/status", { studentId, status });

export const setModuleProgress = (studentId: string, moduleId: string, complete: boolean) =>
  adminPost("students/progress", { action: "module", studentId, moduleId, complete });

export const setAllModules = (studentId: string, complete: boolean) =>
  adminPost("students/progress", { action: "all-modules", studentId, complete });

export const setFinalPassed = (studentId: string, passed: boolean) =>
  adminPost<{ ok: true; notice?: string }>("students/progress", {
    action: "final",
    studentId,
    passed,
  });

export const setLeadStatus = (id: string, status: CollegeLead["status"]) =>
  adminPost("leads/status", { id, status });

/**
 * Five-minute download link for a student's uploaded file. The server only
 * issues it if the caller may see that student's record.
 */
export async function submissionFileUrl(kind: "submission" | "project", id: string): Promise<string> {
  const res = await fetch("/api/admin/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data?.url !== "string") {
    throw new Error(typeof data?.error === "string" ? data.error : "Could not open the file.");
  }
  return data.url;
}

export const evaluateProject = (
  submissionId: string,
  criterionScores: Record<string, number>,
  feedback: string,
) =>
  adminPost<{ ok: true; overallScore: number }>("projects/evaluate", {
    submissionId,
    criterionScores,
    feedback,
  });

export const scoreChallengeEntry = (entryId: string, score: number, feedback: string) =>
  adminPost("challenges/score", { entryId, score, feedback });

export const setFellowshipStage = (applicationId: string, stage: FellowshipStage) =>
  adminPost("fellowship/stage", { applicationId, stage });

export const decideScholarship = (
  applicationId: string,
  status: "approved" | "declined" | "under-review",
  awardedTier: ScholarshipTier | null,
) =>
  adminPost(
    "scholarships/decide",
    status === "approved" ? { applicationId, status, awardedTier } : { applicationId, status },
  );
