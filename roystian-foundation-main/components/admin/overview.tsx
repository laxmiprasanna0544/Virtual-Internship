"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  CreditCard,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { StatusBadge } from "@/components/shared/status-badge";
import { DemoNote } from "@/components/shared/demo-banner";
import {
  CompletionBarChart,
  DomainBarChart,
  RegistrationsChart,
  RevenueChart,
  SplitDonut,
} from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/lib/admin-data";
import {
  completionSplit,
  computeKpis,
  domainBreakdown,
  programSplit,
  registrationsOverTime,
} from "@/lib/analytics";
import { getDomain } from "@/data/domains";
import { formatDate, formatINR } from "@/lib/utils";

export function AdminOverview() {
  const db = useAdminData();

  if (!db) return <LoadingState label="Loading admin data" rows={4} />;

  const kpis = computeKpis(db);
  const timeline = registrationsOverTime(db);
  const domains = domainBreakdown(db);
  const recent = [...db.registrations]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programme Overview"
        description="Live view of registrations, revenue and completion across every domain."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/analytics">
              Full analytics <ArrowRight />
            </Link>
          </Button>
        }
      />

      <DemoNote>
        Every figure on this page is computed from the seeded demo dataset stored in your
        browser. Actions you take in the admin area update the student dashboard
        immediately.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Students"
          value={kpis.totalStudents}
          icon={Users}
          hint={`${kpis.activeStudents} active`}
        />
        <StatCard
          label="Today's Registrations"
          value={kpis.todayRegistrations}
          icon={UserPlus}
          hint="since midnight"
          delay={0.05}
        />
        <StatCard
          label="Revenue"
          value={formatINR(kpis.revenue)}
          icon={CreditCard}
          hint="collected"
          delay={0.1}
        />
        <StatCard
          label="Completed Internships"
          value={kpis.completedInternships}
          icon={GraduationCap}
          hint={`${kpis.completionRate}% completion rate`}
          delay={0.15}
        />
        <StatCard
          label="Certificates Issued"
          value={kpis.certificatesIssued}
          icon={Award}
          hint="valid certificates"
          delay={0.2}
        />
        <StatCard
          label="PehlaChance"
          value={kpis.pehlaChanceActivations}
          icon={Sparkles}
          hint="activations"
          delay={0.25}
        />
      </div>

      {/* Program split */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Self-Paced · ₹1,500
          </p>
          <p className="mt-2.5 font-display text-2xl font-semibold text-foreground">
            <AnimatedCounter value={kpis.selfPacedCount} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatINR(kpis.selfPacedCount * 1500)} collected
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Industry-Led · ₹5,000
          </p>
          <p className="mt-2.5 font-display text-2xl font-semibold text-foreground">
            <AnimatedCounter value={kpis.industryLedCount} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatINR(kpis.industryLedCount * 5000)} collected
          </p>
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RegistrationsChart data={timeline} />
        <RevenueChart data={timeline} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DomainBarChart data={domains} />
        <div className="grid gap-4">
          <SplitDonut
            data={programSplit(db)}
            title="Program distribution"
            description="Share of registrations by programme"
          />
          <CompletionBarChart data={completionSplit(db)} />
        </div>
      </div>

      {/* Recent registrations */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent registrations
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/registrations">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {recent.map((registration) => (
            <li
              key={registration.id}
              className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {registration.studentName}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {getDomain(registration.domainId)?.name} ·{" "}
                  <span className="font-mono">{registration.id}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {formatINR(registration.amount)}
                </span>
                <StatusBadge status={registration.internshipStatus} />
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(registration.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Attention */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/assignments"
          className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/35"
        >
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-foreground">
            {kpis.pendingSubmissions}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Practical tasks awaiting review
          </p>
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/35"
        >
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-foreground">
            {kpis.newLeads}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">New college leads</p>
        </Link>
        <Link
          href="/admin/certificates"
          className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/35"
        >
          <Award className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-semibold text-foreground">
            {kpis.certificatesIssued}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">Certificates to manage</p>
        </Link>
      </section>
    </div>
  );
}
