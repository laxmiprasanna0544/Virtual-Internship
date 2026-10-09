/**
 * Career readiness and badges for one student, from their records. Pure, so
 * the student's own screens, the campus dashboard and the server (public
 * profiles, fellowship applications) all compute the same numbers.
 */

import { badgeStates, type BadgeState } from "@/lib/badges";
import { computeReadiness } from "@/lib/readiness";
import type {
  CareerReadiness,
  ChallengeEntry,
  InterviewSession,
  Progress,
  ProjectSubmission,
  Student,
  Submission,
} from "@/types";

export interface CareerInputs {
  student: Student | null;
  progress: Progress | null;
  submission: Submission | null;
  projects: ProjectSubmission[];
  interviews: InterviewSession[];
  challenges: ChallengeEntry[];
}

export function careerSnapshot(inputs: CareerInputs): {
  readiness: CareerReadiness;
  badges: BadgeState[];
} {
  const readiness = computeReadiness(inputs);
  const badges = badgeStates({ ...inputs, readiness });
  return { readiness, badges };
}

/** The collections needed to compute readiness for many students at once. */
export interface CohortCareerData {
  students: Student[];
  progress: Progress[];
  submissions: Submission[];
  projectSubmissions: ProjectSubmission[];
  interviews: InterviewSession[];
  challengeEntries: ChallengeEntry[];
}

export function careerInputsFor(data: CohortCareerData, studentId: string): CareerInputs {
  const student = data.students.find((s) => s.id === studentId) ?? null;
  return {
    student,
    progress:
      data.progress.find((p) => p.studentId === studentId && p.domainId === student?.domainId) ??
      null,
    submission:
      data.submissions.find((s) => s.studentId === studentId && s.domainId === student?.domainId) ??
      null,
    projects: data.projectSubmissions.filter((p) => p.studentId === studentId),
    interviews: data.interviews.filter((s) => s.studentId === studentId),
    challenges: data.challengeEntries.filter((c) => c.studentId === studentId),
  };
}

/** Readiness for any student in a cohort dataset (admin, campus). */
export function readinessForStudent(data: CohortCareerData, studentId: string): CareerReadiness {
  return computeReadiness(careerInputsFor(data, studentId));
}
