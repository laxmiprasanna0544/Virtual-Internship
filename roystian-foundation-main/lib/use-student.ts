"use client";

import { useMemo } from "react";
import { getDomain, getFinalAssessment } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getTrainerForDomain } from "@/data/trainers";
import { useDatabase } from "@/lib/db";
import { useSession } from "@/lib/auth";
import {
  completionRequirements,
  isCertificateUnlocked,
  summariseProgress,
} from "@/lib/progress";
import { buildSchedule } from "@/lib/schedule";
import type {
  Assessment,
  Certificate,
  CompletionRequirement,
  Domain,
  Module,
  Program,
  Progress,
  Registration,
  ScheduleItem,
  Student,
  Submission,
  Trainer,
} from "@/types";
import type { ProgressSummary } from "@/lib/progress";

export interface StudentContext {
  ready: boolean;
  student: Student | null;
  domain: Domain | null;
  program: Program | null;
  registration: Registration | null;
  /** Every domain/programme the student has ever purchased, newest first. */
  registrations: Registration[];
  progress: Progress | null;
  submission: Submission | null;
  summary: ProgressSummary;
  requirements: CompletionRequirement[];
  certificateUnlocked: boolean;
  certificate: Certificate | null;
  nextModule: Module | null;
  finalAssessment: Assessment | null;
  schedule: ScheduleItem[];
  trainer: Trainer | null;
}

const EMPTY_SUMMARY: ProgressSummary = {
  moduleTotal: 0,
  modulesCompleted: 0,
  modulePercent: 0,
  assessmentTotal: 0,
  assessmentsPassed: 0,
  finalPassed: false,
  finalPercentage: null,
  practicalStatus: "pending",
  overallPercent: 0,
  nextModuleId: null,
};

/** Everything a student-facing screen needs, derived from one database read. */
export function useStudentContext(): StudentContext {
  const db = useDatabase();
  const { student: sessionStudent, ready } = useSession();

  return useMemo(() => {
    if (!db || !ready || !sessionStudent) {
      return {
        ready: false,
        student: null,
        domain: null,
        program: null,
        registration: null,
        registrations: [],
        progress: null,
        submission: null,
        summary: EMPTY_SUMMARY,
        requirements: [],
        certificateUnlocked: false,
        certificate: null,
        nextModule: null,
        finalAssessment: null,
        schedule: [],
        trainer: null,
      };
    }

    const student =
      db.students.find((s) => s.id === sessionStudent.id) ?? sessionStudent;
    const domain = getDomain(student.domainId) ?? null;
    const program = getProgram(student.programId) ?? null;
    const registrations = db.registrations
      .filter((r) => r.studentId === student.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const registration =
      registrations.find((r) => r.domainId === student.domainId) ??
      registrations[0] ??
      null;
    const progress =
      db.progress.find(
        (p) => p.studentId === student.id && p.domainId === student.domainId,
      ) ?? null;
    const submission =
      db.submissions.find(
        (s) => s.studentId === student.id && s.domainId === student.domainId,
      ) ?? null;
    const summary = summariseProgress(student, progress, submission);
    const requirements = completionRequirements(student, progress, submission);
    const certificate =
      db.certificates.find(
        (c) => c.studentId === student.id && c.domainId === student.domainId,
      ) ??
      db.certificates.find((c) => c.studentId === student.id) ??
      null;
    const nextModule =
      domain?.modules.find((m) => m.id === summary.nextModuleId) ?? null;

    return {
      ready: true,
      student,
      domain,
      program,
      registration,
      registrations,
      progress,
      submission,
      summary,
      requirements,
      certificateUnlocked: isCertificateUnlocked(student, progress, submission),
      certificate,
      nextModule,
      finalAssessment: domain ? (getFinalAssessment(domain.id) ?? null) : null,
      schedule:
        program?.liveSessions && registration
          ? buildSchedule(domain?.id, registration.startDate)
          : [],
      trainer: domain ? getTrainerForDomain(domain.id) : null,
    };
  }, [db, ready, sessionStudent]);
}
