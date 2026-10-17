"use client";

import {
  currentStudentRecords,
  postJSON,
  refreshStudentData,
  StudentDataError,
} from "@/lib/student-data";
import type { FellowshipApplication, ScholarshipApplication, ScholarshipTier } from "@/types";

export { fellowshipEligibility } from "@/lib/opportunity-rules";
export type { FellowshipEligibility } from "@/lib/opportunity-rules";

/* ------------------------------------------------------------------ */
/*  Advanced Internship Pathway / Roystian Talent Fellowship            */
/* ------------------------------------------------------------------ */

export function fellowshipFor(_studentId?: string): FellowshipApplication | null {
  return currentStudentRecords()?.fellowship ?? null;
}

/**
 * Applies on the server, which re-checks eligibility and freezes the
 * readiness score at this moment — neither is taken from the browser.
 */
export async function applyForFellowship(input: {
  motivation: string;
  availableFrom: string;
  canRelocate: boolean;
  preferredArea: string;
}): Promise<FellowshipApplication> {
  const { application } = await postJSON<{ application: FellowshipApplication }>(
    "/api/fellowship/apply",
    input,
  );
  await refreshStudentData();
  return application;
}

/* ------------------------------------------------------------------ */
/*  Roystian Skill Scholarship                                         */
/* ------------------------------------------------------------------ */

export function scholarshipFor(_studentId?: string): ScholarshipApplication | null {
  return currentStudentRecords()?.scholarships[0] ?? null;
}

/** A submitted application is final; the programme team decides it. */
export async function applyForScholarship(input: {
  requestedTier: ScholarshipTier;
  householdIncomeBand: string;
  category: string;
  statement: string;
}): Promise<void> {
  if (scholarshipFor()?.status === "submitted" || scholarshipFor()?.status === "under-review") {
    throw new StudentDataError("You already have an application under review.");
  }
  await postJSON("/api/scholarships/apply", input);
  await refreshStudentData();
}

/* Re-exported so client components can pull store + content from one module. */
export {
  FELLOWSHIP_AREAS,
  FELLOWSHIP_READINESS_FLOOR,
  FELLOWSHIP_STAGE_LABEL,
  INCOME_BANDS,
  SCHOLARSHIP_CATEGORIES,
  SCHOLARSHIP_TIERS,
} from "@/data/opportunities";
