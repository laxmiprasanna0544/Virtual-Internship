"use client";

import { FELLOWSHIP_READINESS_FLOOR } from "@/data/opportunities";
import { getDB, updateDB } from "@/lib/db";
import { uid } from "@/lib/ids";
import type {
  CareerReadiness,
  ChallengeEntry,
  EligibilityCriterion,
  FellowshipApplication,
  ProjectSubmission,
  ScholarshipApplication,
  ScholarshipTier,
  Student,
  Submission,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Advanced Internship Pathway / Roystian Talent Fellowship            */
/* ------------------------------------------------------------------ */

/**
 * "The opportunity is earned."
 *
 * The PRD sets four gates — complete the internship, pass assessments, submit
 * projects, attempt an industry challenge — and says selection also considers
 * interview, availability and eligibility. These thresholds are the platform's
 * half of that: what a student must demonstrate before they can even apply.
 *
 * Nothing here promises selection. The copy around it must not either.
 */

export interface FellowshipEligibility {
  criteria: EligibilityCriterion[];
  eligible: boolean;
  metCount: number;
}

export function fellowshipEligibility(args: {
  student: Student | null;
  certificateIssued: boolean;
  assessmentsPassed: number;
  assessmentTotal: number;
  submission: Submission | null;
  projects: ProjectSubmission[];
  challenges: ChallengeEntry[];
  readiness: CareerReadiness;
}): FellowshipEligibility {
  const {
    certificateIssued,
    assessmentsPassed,
    assessmentTotal,
    projects,
    challenges,
    readiness,
  } = args;

  const submittedProjects = projects.filter(
    (p) => p.status === "submitted" || p.status === "evaluated",
  );
  const attemptedChallenges = challenges.filter(
    (c) => c.status === "submitted" || c.status === "evaluated",
  );

  const criteria: EligibilityCriterion[] = [
    {
      key: "internship",
      label: "Internship completed",
      met: certificateIssued,
      detail: certificateIssued
        ? "Completion certificate issued."
        : "Finish your internship and unlock your certificate.",
      href: "/dashboard/certificate",
    },
    {
      key: "assessments",
      label: "All assessments passed",
      met: assessmentTotal > 0 && assessmentsPassed === assessmentTotal,
      detail: `${assessmentsPassed} of ${assessmentTotal} module assessments passed.`,
      href: "/dashboard/assessments",
    },
    {
      key: "projects",
      label: "Project submitted",
      met: submittedProjects.length > 0,
      detail: submittedProjects.length
        ? `${submittedProjects.length} project${submittedProjects.length === 1 ? "" : "s"} submitted.`
        : "Submit at least one structured project.",
      href: "/dashboard/projects",
    },
    {
      key: "challenge",
      label: "Industry challenge attempted",
      met: attemptedChallenges.length > 0,
      detail: attemptedChallenges.length
        ? `${attemptedChallenges.length} challenge${attemptedChallenges.length === 1 ? "" : "s"} submitted.`
        : "Enter a Roystian Industry Challenge.",
      href: "/opportunities/challenges",
    },
    {
      key: "readiness",
      label: `Career Readiness Score of ${FELLOWSHIP_READINESS_FLOOR}+`,
      met: readiness.score >= FELLOWSHIP_READINESS_FLOOR,
      detail: `Your current score is ${readiness.score}.`,
      href: "/dashboard/readiness",
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  return { criteria, eligible: metCount === criteria.length, metCount };
}

export function fellowshipFor(studentId: string): FellowshipApplication | null {
  return (
    getDB().fellowshipApplications.find((a) => a.studentId === studentId) ?? null
  );
}

export function applyForFellowship(
  studentId: string,
  readinessAtApply: number,
  input: {
    motivation: string;
    availableFrom: string;
    canRelocate: boolean;
    preferredArea: string;
  },
): FellowshipApplication {
  const existing = fellowshipFor(studentId);
  const application: FellowshipApplication = {
    id: existing?.id ?? uid("fellow"),
    studentId,
    stage: "applied",
    readinessAtApply,
    ...input,
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  updateDB((db) => {
    db.fellowshipApplications = existing
      ? db.fellowshipApplications.map((a) =>
          a.studentId === studentId ? application : a,
        )
      : [...db.fellowshipApplications, application];
  });
  return application;
}

/* ------------------------------------------------------------------ */
/*  Roystian Skill Scholarship                                         */
/* ------------------------------------------------------------------ */

export function scholarshipFor(
  studentId: string,
): ScholarshipApplication | null {
  return (
    getDB().scholarshipApplications.find((a) => a.studentId === studentId) ??
    null
  );
}

export function applyForScholarship(
  studentId: string,
  input: {
    requestedTier: ScholarshipTier;
    householdIncomeBand: string;
    category: string;
    statement: string;
  },
): ScholarshipApplication {
  const existing = scholarshipFor(studentId);
  const application: ScholarshipApplication = {
    id: existing?.id ?? uid("schol"),
    studentId,
    awardedTier: null,
    status: "submitted",
    ...input,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };

  updateDB((db) => {
    db.scholarshipApplications = existing
      ? db.scholarshipApplications.map((a) =>
          a.studentId === studentId ? application : a,
        )
      : [...db.scholarshipApplications, application];
  });
  return application;
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

/* ------------------------------------------------------------------ */
/*  Administrative decisions                                           */
/* ------------------------------------------------------------------ */

/** Scores a challenge entry. Feeds problem-solving readiness and the badge. */
export function scoreChallengeEntry(
  entryId: string,
  score: number,
  feedback: string,
): void {
  updateDB((db) => {
    db.challengeEntries = db.challengeEntries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            status: "evaluated",
            score: Math.min(Math.max(Math.round(score), 0), 100),
            feedback,
            evaluatedAt: new Date().toISOString(),
          }
        : entry,
    );
  });
}

export function setFellowshipStage(
  applicationId: string,
  stage: FellowshipApplication["stage"],
): void {
  updateDB((db) => {
    db.fellowshipApplications = db.fellowshipApplications.map((a) =>
      a.id === applicationId
        ? { ...a, stage, updatedAt: new Date().toISOString() }
        : a,
    );
  });
}

export function decideScholarship(
  applicationId: string,
  status: ScholarshipApplication["status"],
  awardedTier: ScholarshipTier | null,
): void {
  updateDB((db) => {
    db.scholarshipApplications = db.scholarshipApplications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status,
            awardedTier,
            decidedAt:
              status === "approved" || status === "declined"
                ? new Date().toISOString()
                : null,
          }
        : a,
    );
  });
}
