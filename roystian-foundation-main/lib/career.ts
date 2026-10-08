"use client";

import { useMemo } from "react";
import { getDomain } from "@/data/domains";
import { getProject, projectsForDomain } from "@/data/projects";
import { getDB, updateDB, useDatabase } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { badgeStates, type BadgeState } from "@/lib/badges";
import { uid } from "@/lib/ids";
import { computeReadiness } from "@/lib/readiness";
import { useStudentContext } from "@/lib/use-student";
import type {
  CareerPassport,
  CareerReadiness,
  ChallengeEntry,
  InterviewSession,
  LinkedInDraft,
  LinkedInSection,
  ProjectBrief,
  ProjectSubmission,
  ResumeDraft,
  Student,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

export function projectSubmissionsFor(studentId: string): ProjectSubmission[] {
  return getDB().projectSubmissions.filter((p) => p.studentId === studentId);
}

export function interviewsFor(studentId: string): InterviewSession[] {
  return getDB().interviews.filter((s) => s.studentId === studentId);
}

export function challengeEntriesFor(studentId: string): ChallengeEntry[] {
  return getDB().challengeEntries.filter((c) => c.studentId === studentId);
}

export function passportFor(studentId: string): CareerPassport | null {
  return getDB().passports.find((p) => p.studentId === studentId) ?? null;
}

export function passportBySlug(slug: string): CareerPassport | null {
  return getDB().passports.find((p) => p.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Project submissions                                                */
/* ------------------------------------------------------------------ */

export function startProject(
  studentId: string,
  brief: ProjectBrief,
): ProjectSubmission {
  const existing = getDB().projectSubmissions.find(
    (p) => p.studentId === studentId && p.projectId === brief.id,
  );
  if (existing) return existing;

  const created: ProjectSubmission = {
    id: uid("projsub"),
    studentId,
    projectId: brief.id,
    domainId: brief.domainId,
    status: "in-progress",
    analysis: "",
    recommendations: "",
    reportFileName: null,
    repoUrl: null,
    criterionScores: {},
    overallScore: null,
    feedback: null,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    evaluatedAt: null,
  };

  updateDB((db) => {
    db.projectSubmissions = [...db.projectSubmissions, created];
  });
  return created;
}

export function saveProjectDraft(
  submissionId: string,
  patch: Partial<Pick<ProjectSubmission, "analysis" | "recommendations" | "repoUrl" | "reportFileName">>,
): void {
  updateDB((db) => {
    db.projectSubmissions = db.projectSubmissions.map((p) =>
      p.id === submissionId ? { ...p, ...patch } : p,
    );
  });
}

export function submitProject(submissionId: string): void {
  updateDB((db) => {
    db.projectSubmissions = db.projectSubmissions.map((p) =>
      p.id === submissionId
        ? { ...p, status: "submitted", submittedAt: new Date().toISOString() }
        : p,
    );
  });
}

/**
 * Trainer/admin evaluation. Criterion scores are weighted by the brief's own
 * weights so the overall score reflects what the brief said would matter.
 */
export function evaluateProject(
  submissionId: string,
  criterionScores: Record<string, number>,
  feedback: string,
): void {
  updateDB((db) => {
    db.projectSubmissions = db.projectSubmissions.map((p) => {
      if (p.id !== submissionId) return p;
      const brief = getProject(p.projectId);
      const overall = brief
        ? Math.round(
            brief.evaluationCriteria.reduce(
              (sum, c) => sum + (criterionScores[c.label] ?? 0) * (c.weight / 100),
              0,
            ),
          )
        : Math.round(
            Object.values(criterionScores).reduce((a, b) => a + b, 0) /
              Math.max(Object.keys(criterionScores).length, 1),
          );
      return {
        ...p,
        status: "evaluated",
        criterionScores,
        overallScore: overall,
        feedback,
        evaluatedAt: new Date().toISOString(),
      };
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Interviews                                                         */
/* ------------------------------------------------------------------ */

export function saveInterview(session: InterviewSession): void {
  updateDB((db) => {
    db.interviews = [...db.interviews, session];
  });
}

/* ------------------------------------------------------------------ */
/*  Challenges                                                         */
/* ------------------------------------------------------------------ */

export function submitChallengeEntry(
  studentId: string,
  challengeId: string,
  approach: string,
  solution: string,
  repoUrl: string | null,
): ChallengeEntry {
  const existing = getDB().challengeEntries.find(
    (c) => c.studentId === studentId && c.challengeId === challengeId,
  );

  const entry: ChallengeEntry = {
    id: existing?.id ?? uid("chal"),
    studentId,
    challengeId,
    status: "submitted",
    approach,
    solution,
    repoUrl,
    score: null,
    feedback: null,
    submittedAt: new Date().toISOString(),
    evaluatedAt: null,
  };

  updateDB((db) => {
    db.challengeEntries = existing
      ? db.challengeEntries.map((c) => (c.id === existing.id ? entry : c))
      : [...db.challengeEntries, entry];
  });
  return entry;
}

/* ------------------------------------------------------------------ */
/*  Career Passport                                                    */
/* ------------------------------------------------------------------ */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slugs must stay unique — the public profile route resolves on them. */
function uniqueSlug(base: string, studentId: string): string {
  const existing = getDB().passports;
  let candidate = base;
  let suffix = 2;
  while (existing.some((p) => p.slug === candidate && p.studentId !== studentId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function ensurePassport(student: Student): CareerPassport {
  const existing = passportFor(student.id);
  if (existing) return existing;

  const domain = getDomain(student.domainId);
  const created: CareerPassport = {
    studentId: student.id,
    slug: uniqueSlug(slugify(student.name) || student.id, student.id),
    published: false,
    headline: domain
      ? `${domain.shortName} intern · Roystian Foundation`
      : "Roystian Foundation intern",
    about: "",
    visibility: {
      readiness: true,
      projects: true,
      assessments: true,
      badges: true,
      certificate: true,
      contact: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  updateDB((db) => {
    db.passports = [...db.passports, created];
  });
  return created;
}

export function updatePassport(
  studentId: string,
  patch: Partial<Omit<CareerPassport, "studentId" | "createdAt">>,
): void {
  updateDB((db) => {
    db.passports = db.passports.map((p) => {
      if (p.studentId !== studentId) return p;
      const nextSlug = patch.slug
        ? uniqueSlug(slugify(patch.slug) || p.slug, studentId)
        : p.slug;
      return {
        ...p,
        ...patch,
        slug: nextSlug,
        updatedAt: new Date().toISOString(),
      };
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Resume & LinkedIn drafts                                           */
/* ------------------------------------------------------------------ */

export function resumeFor(studentId: string): ResumeDraft | null {
  return getDB().resumes.find((r) => r.studentId === studentId) ?? null;
}

export function saveResume(draft: ResumeDraft): void {
  updateDB((db) => {
    const exists = db.resumes.some((r) => r.studentId === draft.studentId);
    const next = { ...draft, updatedAt: new Date().toISOString() };
    db.resumes = exists
      ? db.resumes.map((r) => (r.studentId === draft.studentId ? next : r))
      : [...db.resumes, next];
  });
}

export function linkedInFor(studentId: string): LinkedInDraft | null {
  return getDB().linkedInDrafts.find((d) => d.studentId === studentId) ?? null;
}

export function saveLinkedIn(
  studentId: string,
  sections: Record<LinkedInSection, string>,
): void {
  updateDB((db) => {
    const next: LinkedInDraft = {
      studentId,
      sections,
      updatedAt: new Date().toISOString(),
    };
    const exists = db.linkedInDrafts.some((d) => d.studentId === studentId);
    db.linkedInDrafts = exists
      ? db.linkedInDrafts.map((d) => (d.studentId === studentId ? next : d))
      : [...db.linkedInDrafts, next];
  });
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
 * Career-system state for the signed-in student, derived from one database
 * read. Everything here is computed from real activity — there is no stored
 * readiness score to drift out of date.
 */
export function useCareerContext(): CareerContext {
  const db = useDatabase();
  const { student, progress, submission, ready } = useStudentContext();

  return useMemo(() => {
    if (!db || !ready || !student) {
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

    const projects = db.projectSubmissions.filter(
      (p) => p.studentId === student.id,
    );
    const interviews = db.interviews.filter((s) => s.studentId === student.id);
    const challenges = db.challengeEntries.filter(
      (c) => c.studentId === student.id,
    );

    const readiness = computeReadiness({
      student,
      progress,
      submission,
      projects,
      interviews,
      challenges,
    });

    const badges = badgeStates({
      student,
      progress,
      submission,
      projects,
      challenges,
      readiness,
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
      passport: db.passports.find((p) => p.studentId === student.id) ?? null,
    };
  }, [db, ready, student, progress, submission]);
}

/** Readiness for an arbitrary student — used by admin and college views. */
export function readinessForStudent(studentId: string): CareerReadiness {
  const db = getDB();
  const student = db.students.find((s) => s.id === studentId) ?? null;
  const progress =
    db.progress.find(
      (p) => p.studentId === studentId && p.domainId === student?.domainId,
    ) ?? null;
  const submission = db.submissions.find((s) => s.studentId === studentId) ?? null;

  return computeReadiness({
    student,
    progress,
    submission,
    projects: db.projectSubmissions.filter((p) => p.studentId === studentId),
    interviews: db.interviews.filter((s) => s.studentId === studentId),
    challenges: db.challengeEntries.filter((c) => c.studentId === studentId),
  });
}
