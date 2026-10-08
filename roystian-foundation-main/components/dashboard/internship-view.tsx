"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { CompletionChecklist } from "@/components/dashboard/completion-checklist";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useStudentContext } from "@/lib/use-student";
import { FIFTEEN_DAY_PHASES, EXPERIENCE_LEVELS } from "@/data/content";
import { formatDate, formatINR } from "@/lib/utils";

export function InternshipView() {
  const ctx = useStudentContext();

  if (!ctx.ready) return <LoadingState label="Loading internship" rows={3} />;

  if (!ctx.domain || !ctx.student) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No active internship"
        description="Choose a domain and a programme to start your virtual internship."
        actionLabel="Start my internship"
        actionHref="/start"
      />
    );
  }

  const { domain, program, registration, student, trainer, schedule, summary } = ctx;
  const level = EXPERIENCE_LEVELS.find((e) => e.value === student.experience);
  const completedSessions = schedule.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Internship"
        description="Everything about your current enrolment in one place."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Internship" },
        ]}
      />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DynamicIcon name={domain.icon} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {domain.name} Virtual Internship
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{domain.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{level?.label}</Badge>
                <Badge variant="outline">{program?.name}</Badge>
                {registration && <StatusBadge status={registration.internshipStatus} />}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/dashboard/domains">
                <Compass className="h-4 w-4" /> Enroll in another domain
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/internships/${domain.id}`}>
                <ExternalLink /> Public page
              </Link>
            </Button>
          </div>
        </div>

        <dl className="mt-7 grid gap-x-8 gap-y-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Registration ID", value: student.registrationId ?? "—" },
            { label: "Start date", value: formatDate(registration?.startDate) },
            { label: "Duration", value: program?.durationLabel ?? "15 Days" },
            {
              label: "Programme fee",
              value: registration ? formatINR(registration.amount) : "—",
            },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* What you will learn */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                What you will learn
              </h2>
            </div>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {domain.whatYouLearn.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Industry-led block */}
          {program?.liveSessions ? (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    15-Day Internship
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedSessions} of {schedule.length} sessions completed
                </span>
              </div>

              <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {FIFTEEN_DAY_PHASES.map((phase) => (
                  <li
                    key={phase.label}
                    className="rounded-xl border border-border bg-muted/30 p-3.5"
                  >
                    <p className="font-mono text-[0.68rem] font-semibold text-primary">
                      {phase.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {phase.title}
                    </p>
                  </li>
                ))}
              </ol>

              {trainer && (
                <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                        {trainer.name}
                        <Badge variant="warning">Demo profile</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trainer.role} · {trainer.experience} · {trainer.specialization}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/schedule">
                      View schedule <ArrowRight />
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Self-paced programme
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                All learning content, assessments and the practical activity are already
                available. There is no live schedule — you decide the pace, and the
                completion requirements are identical to the Industry-Led programme.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/programs">See what Industry-Led adds</Link>
              </Button>
            </section>
          )}

          {/* PehlaChance */}
          {program?.pehlaChanceIncluded && (
            <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
              <Badge className="mb-3">
                <Sparkles className="h-3 w-3" /> 1 Month FREE
              </Badge>
              <h2 className="font-display text-lg font-semibold text-foreground">
                PehlaChance
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your career journey continues. Access is activated when your internship
                is completed.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/pehlachance">
                  Explore PehlaChance <ArrowRight />
                </Link>
              </Button>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <CompletionChecklist
            requirements={ctx.requirements}
            unlocked={ctx.certificateUnlocked}
          />

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Practical activity
            </h2>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {domain.practicalTask.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {domain.practicalTask.brief}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <StatusBadge status={summary.practicalStatus} />
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/assignments">Open task</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
