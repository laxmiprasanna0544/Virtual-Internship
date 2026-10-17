/**
 * Database rows → career types. Kept apart from mappers.ts because only the
 * career tools, campus and partner views need them.
 */

import type { Tables } from "@/types/db";
import type {
  CareerPassport,
  ChallengeEntry,
  College,
  FellowshipApplication,
  InterviewSession,
  LinkedInDraft,
  LinkedInSection,
  ProjectSubmission,
  ResumeDraft,
  ScholarshipApplication,
  ScholarshipTier,
} from "@/types";

export type ProjectRow = Tables["project_submissions"]["Row"];
export type InterviewRow = Tables["interview_sessions"]["Row"];
export type ChallengeRow = Tables["challenge_entries"]["Row"];
export type PassportRow = Tables["career_passports"]["Row"];
export type ResumeRow = Tables["resume_drafts"]["Row"];
export type LinkedInRow = Tables["linkedin_drafts"]["Row"];
export type FellowshipRow = Tables["fellowship_applications"]["Row"];
export type ScholarshipRow = Tables["scholarship_applications"]["Row"];
export type CollegeRow = Tables["colleges"]["Row"];

export function toProjectSubmission(row: ProjectRow): ProjectSubmission {
  return {
    id: row.id,
    studentId: row.student_id,
    projectId: row.project_id,
    domainId: row.domain_id,
    status: row.status as ProjectSubmission["status"],
    analysis: row.analysis,
    recommendations: row.recommendations,
    reportFileName: row.report_file_name,
    repoUrl: row.repo_url,
    criterionScores: (row.criterion_scores ?? {}) as Record<string, number>,
    overallScore: row.overall_score,
    feedback: row.feedback,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    evaluatedAt: row.evaluated_at,
  };
}

export function toInterviewSession(row: InterviewRow): InterviewSession {
  const scores = (row.scores ?? {}) as Partial<InterviewSession["scores"]>;
  return {
    id: row.id,
    studentId: row.student_id,
    kind: row.kind as InterviewSession["kind"],
    domainId: row.domain_id,
    answers: (row.answers ?? {}) as Record<string, string>,
    scores: { clarity: scores.clarity ?? 0, structure: scores.structure ?? 0, depth: scores.depth ?? 0 },
    overallScore: row.overall_score,
    strengths: row.strengths,
    improvements: row.improvements,
    completedAt: row.completed_at,
  };
}

export function toChallengeEntry(row: ChallengeRow): ChallengeEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    challengeId: row.challenge_id,
    status: row.status as ChallengeEntry["status"],
    approach: row.approach,
    solution: row.solution,
    repoUrl: row.repo_url,
    score: row.score,
    feedback: row.feedback,
    submittedAt: row.submitted_at,
    evaluatedAt: row.evaluated_at,
  };
}

export function toPassport(row: PassportRow): CareerPassport {
  return {
    studentId: row.student_id,
    slug: row.slug,
    published: row.published,
    headline: row.headline,
    about: row.about,
    visibility: row.visibility as CareerPassport["visibility"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toResume(row: ResumeRow): ResumeDraft {
  return {
    studentId: row.student_id,
    headline: row.headline,
    summary: row.summary,
    skills: row.skills,
    includeProjects: row.include_projects,
    includeAssessments: row.include_assessments,
    includeCertificate: row.include_certificate,
    updatedAt: row.updated_at,
  };
}

export function toLinkedIn(row: LinkedInRow): LinkedInDraft {
  return {
    studentId: row.student_id,
    sections: row.sections as Record<LinkedInSection, string>,
    updatedAt: row.updated_at,
  };
}

export function toFellowship(row: FellowshipRow): FellowshipApplication {
  return {
    id: row.id,
    studentId: row.student_id,
    stage: row.stage as FellowshipApplication["stage"],
    readinessAtApply: row.readiness_at_apply,
    motivation: row.motivation,
    availableFrom: row.available_from ?? "",
    canRelocate: row.can_relocate,
    preferredArea: row.preferred_area,
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
  };
}

export function toScholarship(row: ScholarshipRow): ScholarshipApplication {
  return {
    id: row.id,
    studentId: row.student_id,
    requestedTier: row.requested_tier as ScholarshipTier,
    awardedTier: row.awarded_tier as ScholarshipTier | null,
    householdIncomeBand: row.household_income_band,
    category: row.category,
    statement: row.statement,
    status: row.status as ScholarshipApplication["status"],
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export function toCollege(row: CollegeRow): College {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    type: row.type,
    departments: row.departments,
    contactEmail: row.contact_email,
    contactPerson: row.contact_person,
    designation: row.designation,
    phone: row.phone,
    active: row.active,
    createdAt: row.created_at,
  };
}
