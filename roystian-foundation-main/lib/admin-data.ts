"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchAdminData, type AdminData } from "@/lib/supabase/admin-records";
import type { Certificate, CollegeLead, FellowshipStage, ScholarshipTier } from "@/types";

/**
 * Admin console data from Supabase, shared by every admin screen in the tab.
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
  inflight = fetchAdminData(getSupabaseBrowserClient())
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
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "idle", data: null, error: null });
    });
    const onFocus = () => void refreshAdminData();
    window.addEventListener("focus", onFocus);
    return () => {
      subscription.unsubscribe();
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

/** College leads are admin-writable under RLS, so this is a direct update. */
export async function setLeadStatus(id: string, status: CollegeLead["status"]) {
  const { error } = await getSupabaseBrowserClient()
    .from("college_leads")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error("Could not update the lead.");
  await refreshAdminData();
}

/** Short-lived link to a student's uploaded file; RLS limits it to reviewers. */
export async function submissionFileUrl(filePath: string): Promise<string> {
  const { data, error } = await getSupabaseBrowserClient()
    .storage.from("submissions")
    .createSignedUrl(filePath, 60 * 5);
  if (error || !data) throw new Error("Could not open the file.");
  return data.signedUrl;
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
