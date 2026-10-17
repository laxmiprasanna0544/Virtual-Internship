"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isSignOutEvent } from "@/lib/auth";
import type { StudentRecords } from "@/lib/records/mappers";
import type { AssessmentAttempt, Certificate, PublicQuestion, QuestionReview } from "@/types";

/**
 * The signed-in student's records, loaded from /api/student/records (read on
 * the server under row level security).
 *
 * One shared store per tab: every screen reads the same snapshot, and any
 * write below refreshes it so all subscribers re-render together.
 */

export interface StudentDataState {
  status: "idle" | "loading" | "ready" | "error";
  userId: string | null;
  records: StudentRecords | null;
  error: string | null;
}

let state: StudentDataState = { status: "idle", userId: null, records: null, error: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function setState(next: StudentDataState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The latest loaded records, for code that runs outside React render. */
export function currentStudentRecords(): StudentRecords | null {
  return state.records;
}

/** Reloads the student's records. Concurrent calls share one request. */
export function refreshStudentData(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/student/records", { cache: "no-store" });
      if (res.status === 401) {
        setState({ status: "ready", userId: null, records: null, error: null });
        return;
      }
      if (!res.ok) throw new Error("Unable to load your records.");
      const { records } = (await res.json()) as { records: StudentRecords | null };
      const userId = records?.student.id ?? null;
      setState({ status: "ready", userId, records, error: null });
    } catch (error) {
      setState({
        ...state,
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load your records.",
      });
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function useStudentData(): StudentDataState {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );

  useEffect(() => {
    if (state.status === "idle") void refreshStudentData();

    // Sign-in, sign-out and account changes (lib/auth.ts).
    // Signed out: drop the records rather than asking the server (it would answer 401).
    const onSession = (event: Event) => {
      if (isSignOutEvent(event)) setState({ status: "ready", userId: null, records: null, error: null });
      else void refreshStudentData();
    };
    window.addEventListener("rf-session", onSession);
    // Pick up reviewer decisions made while the tab was in the background.
    const onFocus = () => void refreshStudentData();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("rf-session", onSession);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return snapshot;
}

/* ------------------------------------------------------------------ */
/*  Writes (each runs on the server under row level security)          */
/* ------------------------------------------------------------------ */

export class StudentDataError extends Error {}

export async function setModuleComplete(
  domainId: string,
  moduleId: string,
  complete: boolean,
): Promise<void> {
  await postJSON("/api/student/modules", { domainId, moduleId, complete });
  await refreshStudentData();
}

export async function saveModuleNote(
  domainId: string,
  moduleId: string,
  note: string,
): Promise<void> {
  await postJSON("/api/student/notes", { domainId, moduleId, note });
  await refreshStudentData();
}

export async function switchActiveDomain(domainId: string): Promise<boolean> {
  const { switched } = await postJSON<{ switched: boolean }>("/api/student/active-domain", { domainId });
  await refreshStudentData();
  return switched;
}

/**
 * Uploads a file straight to S3 with a presigned POST issued by the server,
 * and returns the object key to submit.
 */
export async function uploadFile(
  request: { purpose: "submission"; domainId: string } | { purpose: "project-report"; projectId: string },
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  const { url, fields, key } = await postJSON<{ url: string; fields: Record<string, string>; key: string }>(
    "/api/uploads",
    { ...request, fileName: file.name, contentType, size: file.size },
  );
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  form.append("file", file);
  const res = await fetch(url, { method: "POST", body: form }).catch(() => null);
  if (!res || !res.ok) {
    throw new StudentDataError(
      res?.status === 400 ? "That file is larger than the 20MB limit." : "The file could not be uploaded. Please try again.",
    );
  }
  return key;
}

export async function submitPracticalTask(input: {
  domainId: string;
  taskTitle: string;
  responseText: string;
  file: File | null;
}): Promise<void> {
  const fileKey = input.file
    ? await uploadFile({ purpose: "submission", domainId: input.domainId }, input.file)
    : null;
  await postJSON("/api/student/submission", {
    domainId: input.domainId,
    responseText: input.responseText,
    fileKey,
    fileName: input.file?.name ?? null,
  });
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Helpers and server-decided actions                                 */
/* ------------------------------------------------------------------ */

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StudentDataError(
      typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.",
    );
  }
  return data as T;
}

/** Questions for an assessment, without answers. */
export async function fetchAssessmentQuestions(assessmentId: string): Promise<PublicQuestion[]> {
  const res = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StudentDataError(typeof data?.error === "string" ? data.error : "Could not load the assessment.");
  }
  return data.questions as PublicQuestion[];
}

/** Scored on the server against the question bank, so the stored score cannot be forged. */
export async function submitAssessment(
  assessmentId: string,
  answers: Record<string, number[]>,
): Promise<{ attempt: AssessmentAttempt; review: QuestionReview[]; attemptsRemaining?: number }> {
  const result = await postJSON<{ attempt: AssessmentAttempt; review: QuestionReview[]; attemptsRemaining?: number }>(
    "/api/assessments/submit",
    { assessmentId, answers },
  );
  await refreshStudentData();
  return result;
}

/** Issues the certificate if, and only if, the server agrees every requirement is met. */
export async function requestCertificate(): Promise<Certificate> {
  const { certificate } = await postJSON<{ certificate: Certificate }>(
    "/api/certificates/issue",
    {},
  );
  await refreshStudentData();
  return certificate;
}
