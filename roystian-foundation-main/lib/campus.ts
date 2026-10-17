"use client";

import { useMemo } from "react";
import { getDomain } from "@/data/domains";
import { useAdminData } from "@/lib/admin-data";
import { readinessForStudent as readinessIn } from "@/lib/career-rules";
import type { AdminData } from "@/lib/records/admin";
import { READINESS_LABEL } from "@/lib/readiness";
import { summariseProgress } from "@/lib/rules";
import type {
  CampusMetrics,
  College,
  SkillGapReport,
  SkillSignal,
  Student,
} from "@/types";

/**
 * The Roystian Campus Dashboard reads live cohort data. The PRD is explicit
 * that real numbers are only used once the system is operational — so every
 * figure here is computed from the students actually in the database. There
 * are no hard-coded cohort counts.
 */

/** A college's cohort is matched on the student's recorded college name. */
export function cohortFor(db: AdminData, college: College): Student[] {
  const needle = college.name.trim().toLowerCase();
  return db.students.filter(
    (s) => s.college.trim().toLowerCase() === needle,
  );
}

/** Career-ready is the same threshold the Career Ready badge uses. */
const CAREER_READY_FLOOR = 75;

export function campusMetrics(db: AdminData, cohort: Student[]): CampusMetrics {
  const ids = new Set(cohort.map((s) => s.id));

  const enrolled = cohort.length;
  const active = cohort.filter((s) => s.status === "active").length;
  const completed = cohort.filter((s) => s.status === "completed").length;
  const projects = db.projectSubmissions.filter(
    (p) => ids.has(p.studentId) && p.status !== "not-started",
  ).length;

  const assessmentScores: number[] = [];
  let careerReady = 0;

  for (const student of cohort) {
    const progress =
      db.progress.find(
        (p) => p.studentId === student.id && p.domainId === student.domainId,
      ) ?? null;

    const attempts = Object.values(progress?.moduleAttempts ?? {});
    for (const attempt of attempts) assessmentScores.push(attempt.percentage);

    if (readinessIn(db, student.id).score >= CAREER_READY_FLOOR) {
      careerReady += 1;
    }
  }

  const avgAssessment = assessmentScores.length
    ? Math.round(
        assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length,
      )
    : 0;

  return { enrolled, active, completed, projects, avgAssessment, careerReady };
}

/* ------------------------------------------------------------------ */
/*  Skill gap report                                                   */
/* ------------------------------------------------------------------ */

/**
 * Interventions are keyed to the readiness area that is weakest, so the
 * recommendation follows from the data rather than being a fixed list.
 */
const INTERVENTIONS: Record<
  string,
  { title: string; rationale: string; format: string }
> = {
  "Technical Skills": {
    title: "Domain fundamentals bootcamp",
    rationale:
      "Assessment averages indicate core concepts are not yet secure across the cohort.",
    format: "2-day intensive workshop per department",
  },
  "Practical Application": {
    title: "Hands-on lab series",
    rationale:
      "Students are completing reading but not converting it into submitted practical work.",
    format: "Weekly supervised lab, 4 weeks",
  },
  "Problem Solving": {
    title: "Industry challenge sprint",
    rationale:
      "Final assessment and challenge scores suggest limited exposure to open-ended problems.",
    format: "One-week cohort-wide challenge",
  },
  Communication: {
    title: "Mock interview drive",
    rationale:
      "Communication is the lowest-scoring readiness area and the least practised.",
    format: "Panel mock interviews with written feedback",
  },
  "Project Execution": {
    title: "Guided industry project",
    rationale:
      "Few students have taken a brief through to an evaluated submission.",
    format: "3-week mentored project per department",
  },
};

export function skillGapReport(
  db: AdminData,
  college: College,
  cohort: Student[],
): SkillGapReport {
  // Cohort average per readiness area — the areas double as the skill signals,
  // because they are what the platform actually measures.
  const totals = new Map<string, { sum: number; count: number }>();

  for (const student of cohort) {
    const readiness = readinessIn(db, student.id);
    for (const area of readiness.breakdown) {
      if (!area.hasEvidence) continue;
      const entry = totals.get(area.label) ?? { sum: 0, count: 0 };
      entry.sum += area.score;
      entry.count += 1;
      totals.set(area.label, entry);
    }
  }

  const signals: SkillSignal[] = Object.values(READINESS_LABEL).map((label) => {
    const entry = totals.get(label);
    return {
      skill: label,
      score: entry ? Math.round(entry.sum / entry.count) : 0,
      studentCount: entry?.count ?? 0,
    };
  });

  // Only areas with recorded evidence can be ranked at all.
  const ranked = [...signals]
    .filter((s) => s.studentCount > 0)
    .sort((a, b) => b.score - a.score);

  // Strengths and gaps must be disjoint. There are only five measured areas,
  // so a naive top-3 / bottom-3 split overlaps and reports the same skill as
  // both a strength and a gap — which makes the whole report untrustworthy.
  let strengths: SkillSignal[];
  let gaps: SkillSignal[];

  if (ranked.length <= 1) {
    // With a single data point, rank position means nothing. Fall back to an
    // absolute read rather than inventing a comparison.
    strengths = ranked.filter((s) => s.score >= 70);
    gaps = ranked.filter((s) => s.score < 70);
  } else {
    const strengthCount = Math.min(3, Math.floor(ranked.length / 2));
    const gapCount = Math.min(3, ranked.length - strengthCount);
    strengths = ranked.slice(0, strengthCount);
    gaps = ranked.slice(strengthCount).slice(-gapCount).reverse();
  }

  const recommendedInterventions = gaps
    .map((gap) => INTERVENTIONS[gap.skill])
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return {
    collegeId: college.id,
    collegeName: college.name,
    cohortSize: cohort.length,
    strengths,
    gaps,
    recommendedInterventions,
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export interface CampusContext {
  ready: boolean;
  college: College | null;
  cohort: Student[];
  metrics: CampusMetrics;
  report: SkillGapReport | null;
  /** Cohort split by domain, for the department view. */
  byDomain: { domainId: string; name: string; count: number; avgReadiness: number }[];
}

const EMPTY_METRICS: CampusMetrics = {
  enrolled: 0,
  active: 0,
  completed: 0,
  projects: 0,
  avgAssessment: 0,
  careerReady: 0,
};

export function useCampusContext(collegeId: string | null): CampusContext {
  // RLS limits this to the college's own cohort for placement-cell accounts.
  const db = useAdminData();

  return useMemo(() => {
    if (!db || !collegeId) {
      return {
        ready: false,
        college: null,
        cohort: [],
        metrics: EMPTY_METRICS,
        report: null,
        byDomain: [],
      };
    }

    const college = db.colleges.find((c) => c.id === collegeId) ?? null;
    if (!college) {
      return {
        ready: true,
        college: null,
        cohort: [],
        metrics: EMPTY_METRICS,
        report: null,
        byDomain: [],
      };
    }

    const cohort = cohortFor(db, college);
    const grouped = new Map<string, Student[]>();
    for (const student of cohort) {
      if (!student.domainId) continue;
      grouped.set(student.domainId, [
        ...(grouped.get(student.domainId) ?? []),
        student,
      ]);
    }

    const byDomain = [...grouped.entries()]
      .map(([domainId, students]) => {
        const avg = students.length
          ? Math.round(
              students.reduce(
                (sum, s) => sum + readinessIn(db, s.id).score,
                0,
              ) / students.length,
            )
          : 0;
        return {
          domainId,
          name: getDomain(domainId)?.name ?? domainId,
          count: students.length,
          avgReadiness: avg,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      ready: true,
      college,
      cohort,
      metrics: campusMetrics(db, cohort),
      report: skillGapReport(db, college, cohort),
      byDomain,
    };
  }, [db, collegeId]);
}

/** Cohort completion rate, used in a couple of headline tiles. */
export function completionRate(
  db: AdminData,
  cohort: Student[],
): number {
  if (cohort.length === 0) return 0;
  const done = cohort.filter((s) => {
    const progress =
      db.progress.find(
        (p) => p.studentId === s.id && p.domainId === s.domainId,
      ) ?? null;
    const submission = db.submissions.find((x) => x.studentId === s.id) ?? null;
    return summariseProgress(s, progress, submission).overallPercent >= 100;
  }).length;
  return Math.round((done / cohort.length) * 100);
}
