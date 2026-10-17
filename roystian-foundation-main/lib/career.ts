"use client";

import { useMemo } from "react";
import { projectsForDomain } from "@/data/projects";
import type { BadgeState } from "@/lib/badges";
import { careerSnapshot } from "@/lib/career-rules";
import {
  currentStudentRecords,
  postJSON,
  refreshStudentData,
  StudentDataError,
  uploadFile,
  useStudentData,
} from "@/lib/student-data";
import type { InterviewFeedback } from "@/lib/interviews";
import { useStudentContext } from "@/lib/use-student";
import type {
  CareerPassport,
  CareerReadiness,
  ChallengeEntry,
  InterviewKind,
  InterviewSession,
  LinkedInDraft,
  LinkedInSection,
  ProjectBrief,
  ProjectSubmission,
  ResumeDraft,
  Student,
} from "@/types";

/**
 * The student's career tools. Reads come from the shared student-data store;
 * writes go through /api/career/* (row level security and the review guards
 * apply on the server) or, where they feed the readiness score, through
 * server-scored routes.
 */

function fail(message: string): never {
  throw new StudentDataError(message);
}

/* ------------------------------------------------------------------ */
/*  Reads (from the loaded records)                                    */
/* ------------------------------------------------------------------ */

export function passportFor(_studentId?: string): CareerPassport | null {
  return currentStudentRecords()?.passport ?? null;
}

export function resumeFor(_studentId?: string): ResumeDraft | null {
  return currentStudentRecords()?.resume ?? null;
}

export function linkedInFor(_studentId?: string): LinkedInDraft | null {
  return currentStudentRecords()?.linkedin ?? null;
}

/* ------------------------------------------------------------------ */
/*  Projects                                                           */
/* ------------------------------------------------------------------ */

export async function startProject(brief: ProjectBrief): Promise<void> {
  await postJSON("/api/career/projects", { action: "start", projectId: brief.id });
  await refreshStudentData();
}

export async function saveProjectDraft(
  submissionId: string,
  patch: Partial<Pick<ProjectSubmission, "analysis" | "recommendations" | "repoUrl">> & { report?: File },
): Promise<void> {
  const projectId = currentStudentRecords()?.projects.find((p) => p.id === submissionId)?.projectId;
  const reportKey =
    patch.report && projectId ? await uploadFile({ purpose: "project-report", projectId }, patch.report) : undefined;
  await postJSON("/api/career/projects", {
    action: "draft",
    submissionId,
    analysis: patch.analysis,
    recommendations: patch.recommendations,
    repoUrl: patch.repoUrl,
    ...(reportKey ? { reportKey, reportFileName: patch.report!.name } : {}),
  });
  await refreshStudentData();
}

export async function submitProject(submissionId: string): Promise<void> {
  await postJSON("/api/career/projects", { action: "submit", submissionId });
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Interviews (scored on the server)                                  */
/* ------------------------------------------------------------------ */

export async function completeInterview(
  kind: InterviewKind,
  answers: Record<string, string>,
): Promise<{ session: InterviewSession; feedback: InterviewFeedback }> {
  const result = await postJSON<{ session: InterviewSession; feedback: InterviewFeedback }>(
    "/api/interviews",
    { kind, answers },
  );
  await refreshStudentData();
  return result;
}

/* ------------------------------------------------------------------ */
/*  Challenges                                                         */
/* ------------------------------------------------------------------ */

export async function submitChallengeEntry(
  challengeId: string,
  approach: string,
  solution: string,
  repoUrl: string | null,
): Promise<void> {
  await postJSON("/api/career/challenges", { challengeId, approach, solution, repoUrl });
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Career Passport                                                    */
/* ------------------------------------------------------------------ */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Creates the student's passport; the server picks a free profile address. */
export async function ensurePassport(_student?: Student): Promise<void> {
  if (passportFor()) return;
  await postJSON("/api/career/passport", { action: "ensure" });
  await refreshStudentData();
}

export async function updatePassport(
  patch: Partial<Pick<CareerPassport, "headline" | "about" | "slug" | "published" | "visibility">>,
): Promise<void> {
  const slug = patch.slug !== undefined ? slugify(patch.slug) : undefined;
  if (slug !== undefined && slug.length < 3) {
    fail("Use at least 3 letters or numbers for your profile address.");
  }
  await postJSON("/api/career/passport", { action: "update", ...patch, ...(slug !== undefined ? { slug } : {}) });
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Resume & LinkedIn drafts                                           */
/* ------------------------------------------------------------------ */

export async function saveResume(draft: Omit<ResumeDraft, "updatedAt" | "studentId">): Promise<void> {
  await postJSON("/api/career/resume", {
    headline: draft.headline,
    summary: draft.summary,
    skills: draft.skills,
    includeProjects: draft.includeProjects,
    includeAssessments: draft.includeAssessments,
    includeCertificate: draft.includeCertificate,
  });
  await refreshStudentData();
}

export async function saveLinkedIn(sections: Record<LinkedInSection, string>): Promise<void> {
  await postJSON("/api/career/linkedin", { sections });
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  The career context hook                                            */
/* ------------------------------------------------------------------ */

export interface CareerContext {
  ready: boolean;
  readiness: CareerReadiness;
  badges: BadgeState[];
  earnedBadges: BadgeState[];
  projects: ProjectSubmission[];
  briefs: ProjectBrief[];
  interviews: InterviewSession[];
  challenges: ChallengeEntry[];
  passport: CareerPassport | null;
}

const EMPTY_READINESS: CareerReadiness = {
  score: 0,
  breakdown: [],
  strengths: [],
  improveNext: [],
  evidenceCoverage: 0,
  updatedAt: new Date(0).toISOString(),
};

/**
 * Career-system state for the signed-in student. Everything is computed from
 * real activity — there is no stored readiness score to drift out of date.
 */
export function useCareerContext(): CareerContext {
  const { records } = useStudentData();
  const { student, progress, submission, ready } = useStudentContext();

  return useMemo(() => {
    if (!ready || !student || !records) {
      return {
        ready: false,
        readiness: EMPTY_READINESS,
        badges: [],
        earnedBadges: [],
        projects: [],
        briefs: [],
        interviews: [],
        challenges: [],
        passport: null,
      };
    }

    const { projects, interviews, challenges, passport } = records;
    const { readiness, badges } = careerSnapshot({
      student,
      progress,
      submission,
      projects,
      interviews,
      challenges,
    });

    return {
      ready: true,
      readiness,
      badges,
      earnedBadges: badges.filter((b) => b.earned),
      projects,
      briefs: student.domainId ? projectsForDomain(student.domainId) : [],
      interviews,
      challenges,
      passport,
    };
  }, [records, ready, student, progress, submission]);
}
