"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchStudentRecordRows } from "@/lib/supabase/student-records";
import { toStudentRecords, type StudentRecords } from "@/lib/supabase/mappers";
import type {
  AssessmentAttempt,
  Certificate,
  PublicQuestion,
  QuestionReview,
  Registration,
} from "@/types";

/**
 * The signed-in student's records, loaded from Supabase.
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

/** Reloads the student's records. Concurrent calls share one request. */
export function refreshStudentData(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState({ status: "ready", userId: null, records: null, error: null });
      return;
    }
    if (state.userId !== user.id) {
      setState({ status: "loading", userId: user.id, records: null, error: null });
    }
    try {
      const rows = await fetchStudentRecordRows(supabase, user.id);
      setState({
        status: "ready",
        userId: user.id,
        records: rows ? toStudentRecords(rows) : null,
        error: null,
      });
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

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => void refreshStudentData(), 0);
      }
    });
    // Pick up reviewer decisions made while the tab was in the background.
    const onFocus = () => void refreshStudentData();
    window.addEventListener("focus", onFocus);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return snapshot;
}

/* ------------------------------------------------------------------ */
/*  Writes made directly from the browser (RLS / RPC enforced)          */
/* ------------------------------------------------------------------ */

export class StudentDataError extends Error {}

export async function setModuleComplete(
  domainId: string,
  moduleId: string,
  complete: boolean,
): Promise<void> {
  const { error } = await getSupabaseBrowserClient().rpc("set_module_complete", {
    target_domain: domainId,
    target_module: moduleId,
    complete,
  });
  if (error) throw new StudentDataError("Unable to update module progress.");
  await refreshStudentData();
}

export async function saveModuleNote(
  domainId: string,
  moduleId: string,
  note: string,
): Promise<void> {
  const { error } = await getSupabaseBrowserClient().rpc("save_module_note", {
    target_domain: domainId,
    target_module: moduleId,
    note,
  });
  if (error) throw new StudentDataError("Unable to save your note.");
  await refreshStudentData();
}

export async function switchActiveDomain(domainId: string): Promise<boolean> {
  const { data, error } = await getSupabaseBrowserClient().rpc("switch_active_domain", {
    target_domain: domainId,
  });
  if (error) throw new StudentDataError("Unable to switch domain.");
  await refreshStudentData();
  return Boolean(data);
}

/** Uploads to the private "submissions" bucket under the student's own folder. */
async function uploadSubmissionFile(userId: string, domainId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  const path = `${userId}/${domainId}/${Date.now()}-${safeName}`;
  const { error } = await getSupabaseBrowserClient()
    .storage.from("submissions")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) {
    throw new StudentDataError(
      error.message.toLowerCase().includes("size")
        ? "That file is larger than the 20MB limit."
        : "The file could not be uploaded. Please try again.",
    );
  }
  return path;
}

export async function submitPracticalTask(input: {
  domainId: string;
  taskTitle: string;
  responseText: string;
  file: File | null;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new StudentDataError("Your session has expired. Sign in again.");

  const filePath = input.file ? await uploadSubmissionFile(user.id, input.domainId, input.file) : null;

  const { error } = await supabase.from("submissions").upsert(
    {
      student_id: user.id,
      domain_id: input.domainId,
      task_title: input.taskTitle,
      response_text: input.responseText,
      ...(filePath ? { file_path: filePath, file_name: input.file!.name } : {}),
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "student_id,domain_id" },
  );
  if (error) {
    throw new StudentDataError(
      error.message.includes("reviewed submission")
        ? "This submission has already been reviewed and can no longer be changed."
        : "Unable to submit your work. Please try again.",
    );
  }
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Writes that must be decided by the server                          */
/* ------------------------------------------------------------------ */

async function postJSON<T>(url: string, body: unknown): Promise<T> {
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
): Promise<{ attempt: AssessmentAttempt; review: QuestionReview[] }> {
  const result = await postJSON<{ attempt: AssessmentAttempt; review: QuestionReview[] }>(
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

export async function enrol(input: {
  domainId: string;
  programId: string;
  experience: string;
  method: string;
}): Promise<Registration> {
  const { registration } = await postJSON<{ registration: Registration }>("/api/enrolments", input);
  await refreshStudentData();
  return registration;
}
