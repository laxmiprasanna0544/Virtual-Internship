"use client";

import { useMemo } from "react";
import { getDomain } from "@/data/domains";
import { projectsForDomain } from "@/data/projects";
import type { BadgeState } from "@/lib/badges";
import { careerSnapshot } from "@/lib/career-rules";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  currentStudentRecords,
  postJSON,
  refreshStudentData,
  StudentDataError,
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
 * The student's career tools, on Supabase. Reads come from the shared
 * student-data store; writes go to Supabase (RLS-limited to the student's own
 * rows) or, where they feed the readiness score, through the server.
 */

const supabase = () => getSupabaseBrowserClient();

async function userId(): Promise<string> {
  const {
    data: { user },
  } = await supabase().auth.getUser();
  if (!user) throw new StudentDataError("Your session has expired. Sign in again.");
  return user.id;
}

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
  const { error } = await supabase()
    .from("project_submissions")
    .upsert(
      {
        student_id: await userId(),
        project_id: brief.id,
        domain_id: brief.domainId,
        status: "in-progress",
        started_at: new Date().toISOString(),
      },
      { onConflict: "student_id,project_id", ignoreDuplicates: true },
    );
  if (error) fail("Could not start the project.");
  await refreshStudentData();
}

export async function saveProjectDraft(
  submissionId: string,
  patch: Partial<Pick<ProjectSubmission, "analysis" | "recommendations" | "repoUrl" | "reportFileName">>,
): Promise<void> {
  const { error } = await supabase()
    .from("project_submissions")
    .update({
      ...(patch.analysis !== undefined ? { analysis: patch.analysis } : {}),
      ...(patch.recommendations !== undefined ? { recommendations: patch.recommendations } : {}),
      ...(patch.repoUrl !== undefined ? { repo_url: patch.repoUrl } : {}),
      ...(patch.reportFileName !== undefined ? { report_file_name: patch.reportFileName } : {}),
    })
    .eq("id", submissionId);
  if (error) fail("Could not save your draft.");
  await refreshStudentData();
}

export async function submitProject(submissionId: string): Promise<void> {
  const { error } = await supabase()
    .from("project_submissions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) fail("Could not submit the project.");
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
  const { error } = await supabase()
    .from("challenge_entries")
    .upsert(
      {
        student_id: await userId(),
        challenge_id: challengeId,
        status: "submitted",
        approach,
        solution,
        repo_url: repoUrl,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "student_id,challenge_id" },
    );
  if (error) {
    fail(
      error.message.includes("evaluate")
        ? "This entry has already been evaluated."
        : "Could not submit your entry.",
    );
  }
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

const UNIQUE_VIOLATION = "23505";

/** Creates the student's passport, finding a free slug if theirs is taken. */
export async function ensurePassport(student: Student): Promise<void> {
  if (passportFor()) return;
  const domain = getDomain(student.domainId);
  const base = slugify(student.name).padEnd(3, "0") || "student";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { error } = await supabase()
      .from("career_passports")
      .insert({
        student_id: student.id,
        slug,
        headline: domain
          ? `${domain.shortName} intern · Roystian Foundation`
          : "Roystian Foundation intern",
      });
    if (!error) break;
    // Another passport has this slug: try the next suffix. If the student
    // already has a passport (another tab created it), stop.
    if (error.code !== UNIQUE_VIOLATION) fail("Could not create your passport.");
    if (error.message.includes("career_passports_pkey")) break;
  }
  await refreshStudentData();
}

export async function updatePassport(
  patch: Partial<Pick<CareerPassport, "headline" | "about" | "slug" | "published" | "visibility">>,
): Promise<void> {
  const slug = patch.slug !== undefined ? slugify(patch.slug) : undefined;
  if (slug !== undefined && slug.length < 3) {
    fail("Use at least 3 letters or numbers for your profile address.");
  }
  const { error } = await supabase()
    .from("career_passports")
    .update({
      ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
      ...(patch.about !== undefined ? { about: patch.about } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(patch.published !== undefined ? { published: patch.published } : {}),
      ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
    })
    .eq("student_id", await userId());
  if (error) {
    fail(error.code === UNIQUE_VIOLATION ? "That profile address is already taken." : "Could not save your passport.");
  }
  await refreshStudentData();
}

/* ------------------------------------------------------------------ */
/*  Resume & LinkedIn drafts                                           */
/* ------------------------------------------------------------------ */

export async function saveResume(draft: Omit<ResumeDraft, "updatedAt" | "studentId">): Promise<void> {
  const { error } = await supabase()
    .from("resume_drafts")
    .upsert({
      student_id: await userId(),
      headline: draft.headline,
      summary: draft.summary,
      skills: draft.skills,
      include_projects: draft.includeProjects,
      include_assessments: draft.includeAssessments,
      include_certificate: draft.includeCertificate,
      updated_at: new Date().toISOString(),
    });
  if (error) fail("Could not save your resume.");
  await refreshStudentData();
}

export async function saveLinkedIn(sections: Record<LinkedInSection, string>): Promise<void> {
  const { error } = await supabase()
    .from("linkedin_drafts")
    .upsert({ student_id: await userId(), sections, updated_at: new Date().toISOString() });
  if (error) fail("Could not save your LinkedIn drafts.");
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
