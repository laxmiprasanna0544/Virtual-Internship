"use client";

import { DOMAINS, getDomain } from "@/data/domains";
import type { Database } from "@/lib/db";
import { summariseProgress } from "@/lib/progress";

export interface Kpis {
  totalStudents: number;
  todayRegistrations: number;
  revenue: number;
  completedInternships: number;
  certificatesIssued: number;
  pehlaChanceActivations: number;
  selfPacedCount: number;
  industryLedCount: number;
  completionRate: number;
  activeStudents: number;
  pendingSubmissions: number;
  newLeads: number;
}

export function computeKpis(db: Database): Kpis {
  const today = new Date().toDateString();
  const successfulPayments = db.payments.filter((p) => p.status === "successful");
  const revenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  const selfPacedCount = db.registrations.filter(
    (r) => r.programId === "self-paced",
  ).length;
  const industryLedCount = db.registrations.filter(
    (r) => r.programId === "industry-led",
  ).length;
  const completed = db.registrations.filter(
    (r) => r.internshipStatus === "certified" || r.internshipStatus === "completed",
  ).length;

  return {
    totalStudents: db.students.length,
    todayRegistrations: db.registrations.filter(
      (r) => new Date(r.createdAt).toDateString() === today,
    ).length,
    revenue,
    completedInternships: completed,
    certificatesIssued: db.certificates.filter((c) => c.status === "valid").length,
    pehlaChanceActivations: db.registrations.filter(
      (r) =>
        r.programId === "industry-led" && r.internshipStatus === "certified",
    ).length,
    selfPacedCount,
    industryLedCount,
    completionRate: db.registrations.length
      ? Math.round((completed / db.registrations.length) * 100)
      : 0,
    activeStudents: db.students.filter((s) => s.status === "active").length,
    pendingSubmissions: db.submissions.filter(
      (s) => s.status === "submitted" || s.status === "pending",
    ).length,
    newLeads: db.leads.filter((l) => l.status === "new").length,
  };
}

export interface TimePoint {
  label: string;
  registrations: number;
  revenue: number;
}

/** Registrations and revenue bucketed into the last `weeks` weekly periods. */
export function registrationsOverTime(db: Database, weeks = 8): TimePoint[] {
  const buckets: TimePoint[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const inRange = db.registrations.filter((r) => {
      const created = new Date(r.createdAt).getTime();
      return created > start.getTime() && created <= end.getTime();
    });

    buckets.push({
      label: end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      registrations: inRange.length,
      revenue: inRange.reduce((sum, r) => sum + r.amount, 0),
    });
  }

  return buckets;
}

export interface DomainPoint {
  domain: string;
  shortName: string;
  registrations: number;
  revenue: number;
  certificates: number;
}

export function domainBreakdown(db: Database): DomainPoint[] {
  return DOMAINS.map((domain) => {
    const regs = db.registrations.filter((r) => r.domainId === domain.id);
    return {
      domain: domain.name,
      shortName: domain.shortName,
      registrations: regs.length,
      revenue: regs.reduce((sum, r) => sum + r.amount, 0),
      certificates: db.certificates.filter((c) => c.domainId === domain.id).length,
    };
  })
    .filter((d) => d.registrations > 0)
    .sort((a, b) => b.registrations - a.registrations);
}

export interface SplitPoint {
  name: string;
  value: number;
}

export function programSplit(db: Database): SplitPoint[] {
  return [
    {
      name: "Self-Paced ₹1,500",
      value: db.registrations.filter((r) => r.programId === "self-paced").length,
    },
    {
      name: "Industry-Led ₹5,000",
      value: db.registrations.filter((r) => r.programId === "industry-led").length,
    },
  ];
}

export function completionSplit(db: Database): SplitPoint[] {
  const counts = { "Not started": 0, "In progress": 0, Completed: 0 };
  for (const registration of db.registrations) {
    if (
      registration.internshipStatus === "certified" ||
      registration.internshipStatus === "completed"
    ) {
      counts.Completed += 1;
    } else if (registration.internshipStatus === "in-progress") {
      counts["In progress"] += 1;
    } else {
      counts["Not started"] += 1;
    }
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function studentProgressPercent(db: Database, studentId: string): number {
  const student = db.students.find((s) => s.id === studentId);
  if (!student) return 0;
  const progress =
    db.progress.find(
      (p) => p.studentId === studentId && p.domainId === student.domainId,
    ) ?? null;
  const submission =
    db.submissions.find((s) => s.studentId === studentId) ?? null;
  return summariseProgress(student, progress, submission).overallPercent;
}

export function domainLabel(domainId: string | null | undefined): string {
  return getDomain(domainId)?.name ?? "—";
}
