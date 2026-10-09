import { FELLOWSHIP_READINESS_FLOOR } from "@/data/opportunities";
import type {
  CareerReadiness,
  ChallengeEntry,
  EligibilityCriterion,
  ProjectSubmission,
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
