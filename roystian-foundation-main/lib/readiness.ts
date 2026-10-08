"use client";

import { getDomain, getDomainAssessments } from "@/data/domains";
import { projectsForDomain } from "@/data/projects";
import { summariseProgress } from "@/lib/progress";
import { clamp } from "@/lib/utils";
import type {
  CareerReadiness,
  ChallengeEntry,
  InterviewSession,
  Progress,
  ProjectSubmission,
  ReadinessArea,
  ReadinessBreakdown,
  Student,
  Submission,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  The Career Readiness model                                          */
/* ------------------------------------------------------------------ */

/**
 * The PRD requires the score to be derived from real platform activity and
 * never presented as an employment guarantee. Every area below therefore maps
 * to evidence the student actually produced — an assessment they sat, a
 * project they submitted, an interview they completed.
 *
 * Weights are collected here so the model can be retuned in one place. They
 * must sum to 1.
 */
export const READINESS_WEIGHTS: Record<ReadinessArea, number> = {
  "technical-skills": 0.25,
  "practical-application": 0.2,
  "problem-solving": 0.2,
  communication: 0.15,
  "project-execution": 0.2,
};

export const READINESS_LABEL: Record<ReadinessArea, string> = {
  "technical-skills": "Technical Skills",
  "practical-application": "Practical Application",
  "problem-solving": "Problem Solving",
  communication: "Communication",
  "project-execution": "Project Execution",
};

/** Guidance shown next to a weak area. */
const IMPROVEMENT_HINT: Record<ReadinessArea, string> = {
  "technical-skills": "Retake module assessments you scored below 80% on.",
  "practical-application": "Submit your practical activity for review.",
  "problem-solving": "Sit the final assessment, or improve your best score.",
  communication: "Run a mock interview — communication is scored from it.",
  "project-execution": "Submit a project with analysis and recommendations.",
};

const STRENGTH_FLOOR = 75;
const IMPROVE_CEILING = 65;

export interface ReadinessInputs {
  student: Student | null;
  progress: Progress | null;
  submission: Submission | null;
  projects: ProjectSubmission[];
  interviews: InterviewSession[];
  challenges: ChallengeEntry[];
}

/* --------------------------- Area scoring -------------------------- */

/** Mean of the student's best attempt on each module assessment. */
function technicalSkills(
  progress: Progress | null,
  domainId: string | null | undefined,
): { score: number; basis: string; hasEvidence: boolean } {
  if (!domainId) {
    return { score: 0, basis: "No domain selected yet.", hasEvidence: false };
  }
  const assessments = getDomainAssessments(domainId);
  const attempts = assessments
    .map((a) => progress?.moduleAttempts?.[a.id])
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  if (attempts.length === 0) {
    return {
      score: 0,
      basis: "No module assessments attempted yet.",
      hasEvidence: false,
    };
  }

  const mean =
    attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length;

  // An unattempted assessment is not a zero — it is missing evidence. We scale
  // by coverage so a student who aced 2 of 10 does not read as fully ready.
  const coverage = attempts.length / Math.max(assessments.length, 1);
  const score = mean * (0.6 + 0.4 * coverage);

  return {
    score: clamp(Math.round(score), 0, 100),
    basis: `Average ${Math.round(mean)}% across ${attempts.length} of ${assessments.length} module assessments.`,
    hasEvidence: true,
  };
}

/** Practical activity review status, plus completed module coverage. */
function practicalApplication(
  student: Student | null,
  progress: Progress | null,
  submission: Submission | null,
): { score: number; basis: string; hasEvidence: boolean } {
  const summary = summariseProgress(student, progress, submission);
  const statusScore: Record<string, number> = {
    approved: 100,
    reviewed: 85,
    submitted: 70,
    "needs-revision": 40,
    pending: 0,
  };
  const practical = statusScore[submission?.status ?? "pending"] ?? 0;
  const moduleCoverage = summary.modulePercent;

  // Two thirds the graded activity, one third the work that led up to it.
  const score = practical * 0.65 + moduleCoverage * 0.35;
  const hasEvidence = Boolean(submission?.submittedAt) || moduleCoverage > 0;

  return {
    score: clamp(Math.round(score), 0, 100),
    basis: hasEvidence
      ? `Practical activity ${(submission?.status ?? "pending").replace("-", " ")}; ${summary.modulesCompleted} of ${summary.moduleTotal} modules completed.`
      : "No practical work submitted yet.",
    hasEvidence,
  };
}

/** Final assessment is the closest proxy the platform has for reasoning. */
function problemSolving(
  progress: Progress | null,
  challenges: ChallengeEntry[],
): { score: number; basis: string; hasEvidence: boolean } {
  const final = progress?.finalAttempt ?? null;
  const scored = challenges.filter((c) => typeof c.score === "number");

  if (!final && scored.length === 0) {
    return {
      score: 0,
      basis: "Final assessment not attempted yet.",
      hasEvidence: false,
    };
  }

  const finalScore = final?.percentage ?? 0;
  const challengeMean = scored.length
    ? scored.reduce((sum, c) => sum + (c.score ?? 0), 0) / scored.length
    : null;

  // A challenge is harder evidence than a multiple-choice final, so when both
  // exist the challenge carries the larger share.
  const score =
    challengeMean === null
      ? finalScore
      : final
        ? finalScore * 0.4 + challengeMean * 0.6
        : challengeMean;

  const parts: string[] = [];
  if (final) parts.push(`final assessment ${final.percentage}%`);
  if (challengeMean !== null) {
    parts.push(
      `${scored.length} industry challenge${scored.length === 1 ? "" : "s"} averaging ${Math.round(challengeMean)}%`,
    );
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    basis: `Based on ${parts.join(" and ")}.`,
    hasEvidence: true,
  };
}

/** Scored from mock interviews — the only place spoken/written fluency is measured. */
function communication(
  interviews: InterviewSession[],
  projects: ProjectSubmission[],
): { score: number; basis: string; hasEvidence: boolean } {
  if (interviews.length === 0) {
    // A written project report still demonstrates some communication, but we
    // cap it low so the student is pushed toward a mock interview.
    const written = projects.filter((p) => p.analysis.trim().length > 200);
    if (written.length === 0) {
      return {
        score: 0,
        basis: "No mock interviews completed yet.",
        hasEvidence: false,
      };
    }
    return {
      score: 45,
      basis: `Partial credit from ${written.length} written project report${written.length === 1 ? "" : "s"}. Complete a mock interview for a full score.`,
      hasEvidence: true,
    };
  }

  // Most recent three sessions, so improvement is reflected quickly.
  const recent = [...interviews]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3);
  const mean =
    recent.reduce((sum, s) => sum + (s.scores.clarity + s.scores.structure) / 2, 0) /
    recent.length;

  return {
    score: clamp(Math.round(mean), 0, 100),
    basis: `Clarity and structure across ${recent.length} mock interview${recent.length === 1 ? "" : "s"}.`,
    hasEvidence: true,
  };
}

/** Evaluated project work — the strongest single piece of career evidence. */
function projectExecution(
  projects: ProjectSubmission[],
  domainId: string | null | undefined,
): { score: number; basis: string; hasEvidence: boolean } {
  const available = domainId ? projectsForDomain(domainId).length : 0;
  const evaluated = projects.filter(
    (p) => p.status === "evaluated" && typeof p.overallScore === "number",
  );
  const submitted = projects.filter((p) => p.status === "submitted");

  if (evaluated.length === 0 && submitted.length === 0) {
    return {
      score: 0,
      basis: available
        ? `No projects submitted yet — ${available} available in your domain.`
        : "No projects submitted yet.",
      hasEvidence: false,
    };
  }

  const evaluatedMean = evaluated.length
    ? evaluated.reduce((sum, p) => sum + (p.overallScore ?? 0), 0) /
      evaluated.length
    : 0;

  // Submitted-but-unevaluated work earns provisional credit so the student is
  // not penalised for review latency.
  const provisional = submitted.length ? 65 : 0;
  const score = evaluated.length
    ? evaluatedMean
    : provisional;

  const coverage = available
    ? Math.min((evaluated.length + submitted.length) / available, 1)
    : 1;

  return {
    score: clamp(Math.round(score * (0.75 + 0.25 * coverage)), 0, 100),
    basis: evaluated.length
      ? `${evaluated.length} project${evaluated.length === 1 ? "" : "s"} evaluated, averaging ${Math.round(evaluatedMean)}%.`
      : `${submitted.length} project${submitted.length === 1 ? "" : "s"} submitted, awaiting evaluation.`,
    hasEvidence: true,
  };
}

/* ------------------------- Public interface ------------------------ */

export function computeReadiness(inputs: ReadinessInputs): CareerReadiness {
  const { student, progress, submission, projects, interviews, challenges } =
    inputs;
  const domainId = student?.domainId ?? null;

  const areas: { area: ReadinessArea; result: ReturnType<typeof technicalSkills> }[] =
    [
      { area: "technical-skills", result: technicalSkills(progress, domainId) },
      {
        area: "practical-application",
        result: practicalApplication(student, progress, submission),
      },
      { area: "problem-solving", result: problemSolving(progress, challenges) },
      { area: "communication", result: communication(interviews, projects) },
      {
        area: "project-execution",
        result: projectExecution(projects, domainId),
      },
    ];

  const breakdown: ReadinessBreakdown[] = areas.map(({ area, result }) => ({
    area,
    label: READINESS_LABEL[area],
    score: result.score,
    basis: result.basis,
    hasEvidence: result.hasEvidence,
  }));

  const score = Math.round(
    breakdown.reduce(
      (sum, item) => sum + item.score * READINESS_WEIGHTS[item.area],
      0,
    ),
  );

  const withEvidence = breakdown.filter((b) => b.hasEvidence);
  const evidenceCoverage = Math.round(
    (withEvidence.length / breakdown.length) * 100,
  );

  const strengths = breakdown
    .filter((b) => b.hasEvidence && b.score >= STRENGTH_FLOOR)
    .sort((a, b) => b.score - a.score)
    .map((b) => b.label);

  const improveNext = breakdown
    .filter((b) => b.score <= IMPROVE_CEILING)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((b) => `${b.label} — ${IMPROVEMENT_HINT[b.area]}`);

  return {
    score: clamp(score, 0, 100),
    breakdown,
    strengths,
    improveNext,
    evidenceCoverage,
    updatedAt: new Date().toISOString(),
  };
}

/** Band used for copy and colour, never for an employment claim. */
export function readinessBand(score: number): {
  label: string;
  tone: "muted" | "warning" | "primary" | "success";
  blurb: string;
} {
  if (score >= 80) {
    return {
      label: "Strong evidence",
      tone: "success",
      blurb:
        "You have produced substantial, verifiable work across every area.",
    };
  }
  if (score >= 60) {
    return {
      label: "Building well",
      tone: "primary",
      blurb: "A solid base of evidence. Close the weaker areas to go further.",
    };
  }
  if (score >= 35) {
    return {
      label: "Getting started",
      tone: "warning",
      blurb: "Early evidence recorded. Keep going — most areas are still open.",
    };
  }
  return {
    label: "Not enough evidence yet",
    tone: "muted",
    blurb:
      "Complete assessments, a project and a mock interview to generate a meaningful score.",
  };
}

/** Skills the student can legitimately claim, derived from assessment data. */
export function demonstratedSkills(
  student: Student | null,
  progress: Progress | null,
): string[] {
  const domain = getDomain(student?.domainId);
  if (!domain || !progress) return [];

  return domain.modules
    .filter((m) => {
      const attempt = progress.moduleAttempts?.[m.assessmentId];
      return attempt?.passed && attempt.percentage >= 80;
    })
    .map((m) => m.title);
}
