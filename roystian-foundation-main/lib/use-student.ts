"use client";

import { useMemo } from "react";
import { getDomain, getFinalAssessment } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getTrainerForDomain } from "@/data/trainers";
import { useStudentData } from "@/lib/student-data";
import {
  completionRequirements,
  isCertificateUnlocked,
  summariseProgress,
} from "@/lib/rules";
import { buildSchedule } from "@/lib/schedule";
import type {
  AssessmentInfo,
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
import type { ProgressSummary } from "@/lib/rules";

export interface StudentContext {
  ready: boolean;
  /** Set when the student's records could not be loaded. */
  error: string | null;
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
  finalAssessment: AssessmentInfo | null;
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

/** Everything a student-facing screen needs, derived from the database records. */
export function useStudentContext(): StudentContext {
  const { status, records, error } = useStudentData();

  return useMemo(() => {
    if (status !== "ready" || !records) {
      return {
        ready: false,
        error,
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

    const { student, registrations, progress, submission, certificates } = records;
    const domain = getDomain(student.domainId) ?? null;
    const program = getProgram(student.programId) ?? null;
    const registration =
      registrations.find((r) => r.id === student.registrationId) ??
      registrations.find((r) => r.domainId === student.domainId) ??
      registrations[0] ??
      null;
    const summary = summariseProgress(student, progress, submission);
    const requirements = completionRequirements(student, progress, submission);
    const certificate =
      certificates.find((c) => c.domainId === student.domainId) ?? certificates[0] ?? null;
    const nextModule =
      domain?.modules.find((m) => m.id === summary.nextModuleId) ?? null;

    return {
      ready: true,
      error: null,
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
  }, [status, records, error]);
}
