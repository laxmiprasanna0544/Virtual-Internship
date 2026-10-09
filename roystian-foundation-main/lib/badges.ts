import { BADGES } from "@/data/badges";
import { getDomain, getDomainAssessments } from "@/data/domains";
import type {
  BadgeId,
  CareerReadiness,
  ChallengeEntry,
  EarnedBadge,
  Progress,
  ProjectSubmission,
  SkillBadge,
  Student,
  Submission,
} from "@/types";

export interface BadgeContext {
  student: Student | null;
  progress: Progress | null;
  submission: Submission | null;
  projects: ProjectSubmission[];
  challenges: ChallengeEntry[];
  readiness: CareerReadiness;
}

/**
 * Each rule returns the evidence string when the badge is earned, or null.
 * Returning the evidence rather than a boolean means the badge can always
 * show *why* it was awarded — which is the point of the whole feature.
 */
type BadgeRule = (ctx: BadgeContext) => string | null;

const RULES: Record<BadgeId, BadgeRule> = {
  "domain-fundamentals": ({ student, progress }) => {
    const domain = getDomain(student?.domainId);
    if (!domain || !progress) return null;

    const firstFive = domain.modules.slice(0, 5);
    if (firstFive.length < 5) return null;

    const attempts = firstFive.map((m) => progress.moduleAttempts?.[m.assessmentId]);
    if (attempts.some((a) => !a?.passed)) return null;

    const mean =
      attempts.reduce((sum, a) => sum + (a?.percentage ?? 0), 0) / attempts.length;
    if (mean < 75) return null;

    return `Passed the first five ${domain.shortName} module assessments, averaging ${Math.round(mean)}%.`;
  },

  "data-analysis": ({ projects }) => {
    const scored = projects.filter(
      (p) => p.status === "evaluated" && (p.criterionScores ?? {}),
    );
    for (const project of scored) {
      const entries = Object.entries(project.criterionScores ?? {});
      const analysis = entries.find(([label]) =>
        /analys|diagnos|evaluation rigour|evidence/i.test(label),
      );
      if (analysis && analysis[1] >= 70) {
        return `Scored ${analysis[1]}% on "${analysis[0]}" in an evaluated project.`;
      }
    }
    return null;
  },

  "applied-practice": ({ submission }) => {
    if (!submission) return null;
    if (submission.status === "approved") {
      return "Practical activity approved by a trainer.";
    }
    if (submission.status === "reviewed") {
      return "Practical activity reviewed by a trainer.";
    }
    return null;
  },

  "problem-solving": ({ progress }) => {
    const final = progress?.finalAttempt;
    if (!final?.passed || final.percentage < 80) return null;
    return `Passed the final assessment at ${final.percentage}%.`;
  },

  "project-execution": ({ projects }) => {
    const best = projects
      .filter((p) => p.status === "evaluated" && typeof p.overallScore === "number")
      .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))[0];
    if (!best || (best.overallScore ?? 0) < 70) return null;
    return `Project evaluated at ${best.overallScore}%.`;
  },

  "industry-challenge": ({ challenges }) => {
    const best = challenges
      .filter((c) => c.status === "evaluated" && typeof c.score === "number")
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    if (!best || (best.score ?? 0) < 70) return null;
    return `Scored ${best.score}% on a Roystian Industry Challenge.`;
  },

  "career-ready": ({ readiness }) => {
    if (readiness.score < 75) return null;
    if (readiness.breakdown.some((b) => !b.hasEvidence)) return null;
    return `Career Readiness Score of ${readiness.score} with evidence in all five areas.`;
  },
};

/**
 * Evaluates every badge rule against real progress data.
 *
 * `earnedAt` is deliberately derived from the evidence timestamp where one is
 * available, so a badge does not appear to have been earned the moment the
 * page was opened.
 */
export function evaluateBadges(ctx: BadgeContext): EarnedBadge[] {
  const earned: EarnedBadge[] = [];

  for (const badge of BADGES) {
    const evidence = RULES[badge.id](ctx);
    if (!evidence) continue;
    earned.push({
      badgeId: badge.id,
      earnedAt: latestEvidenceDate(ctx),
      evidence,
    });
  }

  return earned;
}

function latestEvidenceDate(ctx: BadgeContext): string {
  const candidates: string[] = [];
  if (ctx.progress?.updatedAt) candidates.push(ctx.progress.updatedAt);
  if (ctx.submission?.reviewedAt) candidates.push(ctx.submission.reviewedAt);
  for (const p of ctx.projects) {
    if (p.evaluatedAt) candidates.push(p.evaluatedAt);
  }
  for (const c of ctx.challenges) {
    if (c.evaluatedAt) candidates.push(c.evaluatedAt);
  }
  if (candidates.length === 0) return new Date().toISOString();
  return candidates.sort().at(-1)!;
}

export interface BadgeState extends SkillBadge {
  earned: boolean;
  earnedAt: string | null;
  evidence: string | null;
  /** The badge name with the student's domain substituted where relevant. */
  displayName: string;
}

/** Full badge catalogue with earned state — locked badges stay visible. */
export function badgeStates(ctx: BadgeContext): BadgeState[] {
  const earned = evaluateBadges(ctx);
  const domain = getDomain(ctx.student?.domainId);

  return BADGES.map((badge) => {
    const hit = earned.find((e) => e.badgeId === badge.id);
    const displayName =
      badge.id === "domain-fundamentals" && domain
        ? `${domain.shortName} Fundamentals`
        : badge.name;

    return {
      ...badge,
      displayName,
      earned: Boolean(hit),
      earnedAt: hit?.earnedAt ?? null,
      evidence: hit?.evidence ?? null,
    };
  });
}

/** How close the student is to the next unearned badge, for the dashboard. */
export function badgeProgress(ctx: BadgeContext): {
  earnedCount: number;
  total: number;
  next: BadgeState | null;
} {
  const states = badgeStates(ctx);
  const earnedCount = states.filter((s) => s.earned).length;
  const next = states.find((s) => !s.earned) ?? null;
  return { earnedCount, total: states.length, next };
}

/** Assessment coverage helper used by the badges page to explain progress. */
export function assessmentCoverage(
  student: Student | null,
  progress: Progress | null,
): { passed: number; total: number } {
  if (!student?.domainId) return { passed: 0, total: 0 };
  const assessments = getDomainAssessments(student.domainId);
  const passed = assessments.filter(
    (a) => progress?.moduleAttempts?.[a.id]?.passed,
  ).length;
  return { passed, total: assessments.length };
}
