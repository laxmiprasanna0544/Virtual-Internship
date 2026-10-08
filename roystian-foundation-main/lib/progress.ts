"use client";

import {
  getDomain,
  getDomainAssessments,
  getFinalAssessment,
  PASSING_THRESHOLD,
} from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getDB, updateDB } from "@/lib/db";
import { percentage } from "@/lib/utils";
import type {
  Assessment,
  AssessmentAttempt,
  CompletionRequirement,
  Progress,
  Student,
  Submission,
} from "@/types";

export function emptyProgress(studentId: string, domainId: string): Progress {
  return {
    studentId,
    domainId,
    completedModules: [],
    moduleAttempts: {},
    finalAttempt: null,
    notes: {},
    lastModuleId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function getProgress(
  studentId: string | null | undefined,
  domainId: string | null | undefined,
): Progress | null {
  if (!studentId || !domainId) return null;
  const db = getDB();
  return (
    db.progress.find(
      (p) => p.studentId === studentId && p.domainId === domainId,
    ) ?? null
  );
}

export function ensureProgress(studentId: string, domainId: string): Progress {
  const existing = getProgress(studentId, domainId);
  if (existing) return existing;
  const created = emptyProgress(studentId, domainId);
  updateDB((db) => {
    db.progress = [...db.progress, created];
  });
  return created;
}

export function updateProgress(
  studentId: string,
  domainId: string,
  mutator: (progress: Progress) => void,
): Progress {
  ensureProgress(studentId, domainId);
  let updated: Progress | null = null;
  updateDB((db) => {
    db.progress = db.progress.map((p) => {
      if (p.studentId !== studentId || p.domainId !== domainId) return p;
      const next: Progress = {
        ...p,
        completedModules: [...p.completedModules],
        moduleAttempts: { ...p.moduleAttempts },
        notes: { ...p.notes },
      };
      mutator(next);
      next.updatedAt = new Date().toISOString();
      updated = next;
      return next;
    });
  });
  return updated ?? ensureProgress(studentId, domainId);
}

export function markModuleComplete(
  studentId: string,
  domainId: string,
  moduleId: string,
): Progress {
  return updateProgress(studentId, domainId, (p) => {
    if (!p.completedModules.includes(moduleId)) {
      p.completedModules.push(moduleId);
    }
    p.lastModuleId = moduleId;
  });
}

export function markModuleIncomplete(
  studentId: string,
  domainId: string,
  moduleId: string,
): Progress {
  return updateProgress(studentId, domainId, (p) => {
    p.completedModules = p.completedModules.filter((id) => id !== moduleId);
  });
}

export function saveModuleNote(
  studentId: string,
  domainId: string,
  moduleId: string,
  note: string,
): Progress {
  return updateProgress(studentId, domainId, (p) => {
    p.notes[moduleId] = note;
  });
}

export function scoreAssessment(
  assessment: Assessment,
  answers: Record<string, number[]>,
): AssessmentAttempt {
  let score = 0;
  for (const question of assessment.questions) {
    const given = [...(answers[question.id] ?? [])].sort((a, b) => a - b);
    const expected = [...question.correct].sort((a, b) => a - b);
    if (
      given.length === expected.length &&
      given.every((value, index) => value === expected[index])
    ) {
      score += 1;
    }
  }
  const total = assessment.questions.length;
  const pct = percentage(score, total);
  return {
    assessmentId: assessment.id,
    score,
    total,
    percentage: pct,
    passed: pct >= assessment.passingScore,
    answers,
    submittedAt: new Date().toISOString(),
  };
}

export function submitAssessment(
  studentId: string,
  domainId: string,
  assessment: Assessment,
  answers: Record<string, number[]>,
): AssessmentAttempt {
  const attempt = scoreAssessment(assessment, answers);
  updateProgress(studentId, domainId, (p) => {
    if (assessment.kind === "final") {
      if (!p.finalAttempt || attempt.percentage >= p.finalAttempt.percentage) {
        p.finalAttempt = attempt;
      }
    } else {
      const previous = p.moduleAttempts[assessment.id];
      if (!previous || attempt.percentage >= previous.percentage) {
        p.moduleAttempts[assessment.id] = attempt;
      }
      if (attempt.passed && assessment.moduleId) {
        if (!p.completedModules.includes(assessment.moduleId)) {
          p.completedModules.push(assessment.moduleId);
        }
      }
    }
  });
  return attempt;
}

export function getSubmission(
  studentId: string | null | undefined,
  domainId: string | null | undefined,
): Submission | null {
  if (!studentId || !domainId) return null;
  const db = getDB();
  return (
    db.submissions.find(
      (s) => s.studentId === studentId && s.domainId === domainId,
    ) ?? null
  );
}

export interface ProgressSummary {
  moduleTotal: number;
  modulesCompleted: number;
  modulePercent: number;
  assessmentTotal: number;
  assessmentsPassed: number;
  finalPassed: boolean;
  finalPercentage: number | null;
  practicalStatus: Submission["status"];
  overallPercent: number;
  nextModuleId: string | null;
}

export function summariseProgress(
  student: Student | null,
  progress: Progress | null,
  submission: Submission | null,
): ProgressSummary {
  const domain = getDomain(student?.domainId);
  const moduleTotal = domain?.modules.length ?? 0;
  const completed = progress?.completedModules ?? [];
  const modulesCompleted = domain
    ? domain.modules.filter((m) => completed.includes(m.id)).length
    : 0;
  const moduleAssessments = domain ? getDomainAssessments(domain.id) : [];
  const assessmentsPassed = moduleAssessments.filter(
    (a) => progress?.moduleAttempts?.[a.id]?.passed,
  ).length;
  const finalPassed = Boolean(progress?.finalAttempt?.passed);
  const practicalStatus = submission?.status ?? "pending";

  const weights = {
    modules: 0.45,
    assessments: 0.2,
    practical: 0.15,
    final: 0.2,
  };
  const practicalScore =
    practicalStatus === "approved"
      ? 1
      : practicalStatus === "reviewed"
        ? 0.8
        : practicalStatus === "submitted"
          ? 0.6
          : practicalStatus === "needs-revision"
            ? 0.3
            : 0;

  const overall =
    (moduleTotal ? modulesCompleted / moduleTotal : 0) * weights.modules +
    (moduleAssessments.length
      ? assessmentsPassed / moduleAssessments.length
      : 0) *
      weights.assessments +
    practicalScore * weights.practical +
    (finalPassed ? 1 : 0) * weights.final;

  const nextModule = domain?.modules.find((m) => !completed.includes(m.id));

  return {
    moduleTotal,
    modulesCompleted,
    modulePercent: percentage(modulesCompleted, moduleTotal),
    assessmentTotal: moduleAssessments.length,
    assessmentsPassed,
    finalPassed,
    finalPercentage: progress?.finalAttempt?.percentage ?? null,
    practicalStatus,
    overallPercent: Math.round(overall * 100),
    nextModuleId: nextModule?.id ?? null,
  };
}

/** Minimum programme days that must elapse before the ₹5,000 Industry-Led
 *  certificate can be generated, regardless of how fast other requirements
 *  are completed. */
export const INDUSTRY_LED_MIN_DAYS = 15;

/** Whole days elapsed since enrollment, or null if the student never enrolled. */
export function daysSinceEnrollment(student: Student | null): number | null {
  if (!student?.enrolledAt) return null;
  const elapsedMs = Date.now() - new Date(student.enrolledAt).getTime();
  return Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
}

function programDurationRequirement(
  student: Student | null,
): CompletionRequirement {
  const program = getProgram(student?.programId);
  const isTimeGated = program?.id === "industry-led";
  const days = daysSinceEnrollment(student);
  const done = !isTimeGated || (days !== null && days >= INDUSTRY_LED_MIN_DAYS);

  let detail: string;
  if (!isTimeGated) {
    detail = "Not required for this programme.";
  } else if (days === null) {
    detail = "Enrollment date not found.";
  } else if (done) {
    detail = `The ${INDUSTRY_LED_MIN_DAYS}-day Industry-Led programme duration is complete.`;
  } else {
    const remaining = INDUSTRY_LED_MIN_DAYS - days;
    detail = `${remaining} day${remaining === 1 ? "" : "s"} remaining before the certificate can be generated.`;
  }

  return {
    key: "program-duration",
    label: "15-day programme duration completed",
    done,
    detail,
    href: "/dashboard",
  };
}

export function isProfileComplete(student: Student | null): boolean {
  if (!student) return false;
  return Boolean(
    student.name &&
      student.email &&
      student.mobile &&
      student.college &&
      student.course &&
      student.city &&
      student.domainId &&
      student.experience,
  );
}

export function completionRequirements(
  student: Student | null,
  progress: Progress | null,
  submission: Submission | null,
): CompletionRequirement[] {
  const summary = summariseProgress(student, progress, submission);
  const finalAssessment = student?.domainId
    ? getFinalAssessment(student.domainId)
    : undefined;

  return [
    {
      key: "profile",
      label: "Profile completed",
      done: isProfileComplete(student),
      detail: isProfileComplete(student)
        ? "All required profile fields are filled."
        : "Add your remaining profile details.",
      href: "/dashboard/profile",
    },
    {
      key: "modules",
      label: "Learning modules completed",
      done: summary.moduleTotal > 0 && summary.modulesCompleted === summary.moduleTotal,
      detail: `${summary.modulesCompleted} of ${summary.moduleTotal} modules completed.`,
      href: "/dashboard/learning",
    },
    {
      key: "assessments",
      label: "Module assessments completed",
      done:
        summary.assessmentTotal > 0 &&
        summary.assessmentsPassed === summary.assessmentTotal,
      detail: `${summary.assessmentsPassed} of ${summary.assessmentTotal} assessments passed at ${PASSING_THRESHOLD}% or above.`,
      href: "/dashboard/assessments",
    },
    {
      key: "practical",
      label: "Practical task submitted / reviewed",
      done:
        summary.practicalStatus === "submitted" ||
        summary.practicalStatus === "reviewed" ||
        summary.practicalStatus === "approved",
      detail:
        summary.practicalStatus === "pending"
          ? "Your practical activity has not been submitted yet."
          : `Practical task status: ${summary.practicalStatus.replace("-", " ")}.`,
      href: "/dashboard/assignments",
    },
    {
      key: "final",
      label: "Final assessment passed",
      done: summary.finalPassed,
      detail: summary.finalPassed
        ? `Passed with ${summary.finalPercentage}%.`
        : `Pass the final assessment at ${finalAssessment?.passingScore ?? PASSING_THRESHOLD}% or above.`,
      href: "/dashboard/assessments/final",
    },
    programDurationRequirement(student),
  ];
}

export function isCertificateUnlocked(
  student: Student | null,
  progress: Progress | null,
  submission: Submission | null,
): boolean {
  return completionRequirements(student, progress, submission).every(
    (r) => r.done,
  );
}
