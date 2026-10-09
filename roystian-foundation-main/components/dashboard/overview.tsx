"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  PlayCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { CareerStrip } from "@/components/dashboard/career-strip";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { CompletionChecklist } from "@/components/dashboard/completion-checklist";
import { DynamicIcon } from "@/components/shared/icon";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentContext } from "@/lib/use-student";
import { switchActiveDomain } from "@/lib/student-data";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { formatDate, formatINR, cn } from "@/lib/utils";

export function DashboardOverview() {
  const ctx = useStudentContext();

  if (!ctx.ready) return <LoadingState label="Loading your dashboard" rows={3} />;

  if (!ctx.student || !ctx.domain) {
    return (
      <EmptyState
        title="No internship yet"
        description="You have an account but no active internship. Choose a domain and programme to get started."
        actionLabel="Start my internship"
        actionHref="/start"
      />
    );
  }

  const { student, domain, program, summary, nextModule, schedule } = ctx;
  const firstName = student.name.split(" ")[0];
  const nextSession = schedule.find((item) => item.status !== "completed");

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Hi, ${firstName}!`}
        description="Here is where your internship stands today."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/domains">
                <Compass className="h-4 w-4" /> Enroll in Another Domain
              </Link>
            </Button>
            {nextModule ? (
              <Button asChild>
                <Link href={`/dashboard/learning/${nextModule.id}`}>
                  Continue Learning <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/certificate">
                  View certificate status <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Hero */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DynamicIcon name={domain.icon} className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">
                  {domain.name} Virtual Internship
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {program?.name ?? "—"} · Registration {student.registrationId}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">
                  <AnimatedCounter value={summary.overallPercent} suffix="% " />
                  Complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {summary.modulesCompleted} of {summary.moduleTotal} modules completed
                </span>
              </div>
              <Progress
                value={summary.overallPercent}
                className="mt-2.5 h-2.5"
                aria-label="Overall internship progress"
              />
            </div>
          </div>

          {program?.pehlaChanceIncluded && (
            <Link
              href="/pehlachance"
              className="shrink-0 rounded-xl border border-primary/30 bg-primary/[0.05] px-5 py-4 transition-colors hover:bg-primary/[0.09] lg:max-w-[14rem]"
            >
              <Badge className="mb-2">
                <Sparkles className="h-3 w-3" /> Included
              </Badge>
              <p className="text-sm font-semibold text-foreground">PehlaChance</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                1 month free on completion
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* All domains ever purchased — must stay visible after new purchases. */}
      {/* All domains ever purchased — allow switching and adding new domains. */}
      {ctx.registrations.length > 1 ? (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Your Purchased Domains ({ctx.registrations.length})
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Switch between your active virtual internships anytime.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/dashboard/domains">
                <Plus className="h-4 w-4" /> Enroll in another domain
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {ctx.registrations.map((reg) => {
              const regDomain = getDomain(reg.domainId);
              const regProgram = getProgram(reg.programId);
              const active = reg.domainId === student.domainId;
              return (
                <li
                  key={reg.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors",
                    active
                      ? "border-primary/40 bg-primary/[0.03]"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <DynamicIcon name={regDomain?.icon ?? "Layers"} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {regDomain?.name ?? reg.domainId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {regProgram?.name ?? "—"} · {formatDate(reg.createdAt)} ·{" "}
                        {formatINR(reg.amount)} · Registration {reg.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {active ? (
                      <Badge variant="default">Active Internship</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const ok = await switchActiveDomain(reg.domainId);
                            if (ok) {
                              toast.success(`Switched active internship to ${regDomain?.name ?? reg.domainId}!`);
                            } else {
                              toast.error("That domain has no completed payment.");
                            }
                          } catch {
                            toast.error("Unable to switch domain. Please try again.");
                          }
                        }}
                      >
                        Switch to this domain
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/[0.02] p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                Want to build dual specialization?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enroll in another domain to broaden your skills and earn multiple verifiable certificates.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link href="/dashboard/domains">
              <Plus className="h-4 w-4" /> Explore & Enroll
            </Link>
          </Button>
        </section>
      )}

      {/* Career evidence — the V2 headline, above the internship mechanics. */}
      <CareerStrip />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Modules"
          value={`${summary.modulesCompleted}/${summary.moduleTotal}`}
          hint="completed"
          icon={BookOpen}
        />
        <StatCard
          label="Assessments"
          value={`${summary.assessmentsPassed}/${summary.assessmentTotal}`}
          hint="passed"
          icon={ClipboardList}
          delay={0.06}
        />
        <StatCard
          label="Practical task"
          value={summary.practicalStatus.replace("-", " ")}
          hint="current status"
          icon={FileText}
          className="capitalize"
          delay={0.12}
        />
        <StatCard
          label="Final assessment"
          value={summary.finalPassed ? `${summary.finalPercentage}%` : "Pending"}
          hint={summary.finalPassed ? "passed" : "70% to pass"}
          icon={Sparkles}
          delay={0.18}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* Continue learning */}
          {nextModule ? (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Continue Learning
              </h2>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-primary">
                    Module {String(nextModule.number).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">
                    {nextModule.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {nextModule.summary}
                  </p>
                  <ul className="mt-3.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <li className="rounded-md bg-muted px-2 py-1">
                      {nextModule.readMinutes} min read
                    </li>
                    <li className="rounded-md bg-muted px-2 py-1">Resources</li>
                    <li className="rounded-md bg-muted px-2 py-1">Assessment</li>
                  </ul>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link href={`/dashboard/learning/${nextModule.id}`}>
                    <PlayCircle /> Continue Learning
                  </Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-success/30 bg-success/[0.05] p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                All modules complete
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Finish any remaining requirements to unlock your certificate.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/certificate">
                  Check certificate status <ArrowRight />
                </Link>
              </Button>
            </section>
          )}

          {/* Next session */}
          {program?.liveSessions && nextSession && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Next live session
                  </h2>
                  <p className="mt-2.5 font-display text-base font-semibold text-foreground">
                    Day {String(nextSession.day).padStart(2, "0")} — {nextSession.topic}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(nextSession.date)} · {nextSession.time} ·{" "}
                    {ctx.trainer?.name}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/dashboard/schedule">
                    <CalendarDays /> Schedule
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* Journey checklist */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your journey
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: "Profile completed", done: ctx.requirements[0]?.done ?? false },
                { label: "Domain selected", done: Boolean(student.domainId) },
                {
                  label: "Registration completed",
                  done: Boolean(student.registrationId),
                },
                ...domain.modules.slice(0, 2).map((module) => ({
                  label: `Module ${String(module.number).padStart(2, "0")} — ${module.title}`,
                  done: (ctx.progress?.completedModules ?? []).includes(module.id),
                })),
                {
                  label: `Remaining modules (${Math.max(summary.moduleTotal - summary.modulesCompleted, 0)} left)`,
                  done: summary.modulesCompleted === summary.moduleTotal,
                },
                { label: "Practical task", done: ctx.requirements[3]?.done ?? false },
                { label: "Final assessment", done: summary.finalPassed },
                {
                  label: "Internship completion",
                  done: ctx.certificateUnlocked,
                },
                { label: "Certificate unlocked", done: Boolean(ctx.certificate) },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <span aria-hidden="true">{item.done ? "✓" : "⬜"}</span>
                  <span
                    className={
                      item.done ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <CompletionChecklist
            requirements={ctx.requirements}
            unlocked={ctx.certificateUnlocked}
          />

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Quick links
            </h2>
            <ul className="mt-3.5 space-y-1">
              {[
                { href: "/dashboard/learning", label: "All learning modules", icon: BookOpen },
                { href: "/dashboard/assessments", label: "Assessments", icon: ClipboardList },
                { href: "/dashboard/assignments", label: "Practical task", icon: FileText },
                { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <link.icon className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                    <ArrowRight className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
