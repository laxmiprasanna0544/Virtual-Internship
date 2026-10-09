"use client";

import { getDB, updateDB } from "@/lib/db";
import { emptyProgress, scoreAssessment } from "@/lib/rules";
import type { Assessment, AssessmentAttempt, Progress, Submission } from "@/types";

export {
  completionRequirements,
  daysSinceEnrollment,
  emptyProgress,
  INDUSTRY_LED_MIN_DAYS,
  isCertificateUnlocked,
  isProfileComplete,
  scoreAssessment,
  summariseProgress,
} from "@/lib/rules";
export type { ProgressSummary } from "@/lib/rules";

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

