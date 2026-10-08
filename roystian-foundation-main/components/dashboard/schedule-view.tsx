"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudentContext } from "@/lib/use-student";
import { FIFTEEN_DAY_PHASES } from "@/data/content";
import { formatDate } from "@/lib/utils";

export function ScheduleView() {
  const ctx = useStudentContext();

  if (!ctx.ready) return <LoadingState label="Loading schedule" rows={3} />;

  const { program, schedule, trainer } = ctx;

  if (!program?.liveSessions) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Schedule"
          description="Live session timetable for the Industry-Led programme."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Schedule" },
          ]}
        />
        <EmptyState
          icon={CalendarDays}
          title="Self-paced — no live schedule"
          description="Your programme is self-paced, so there are no scheduled live sessions. Work through the modules at whatever pace suits you; all content is already available."
          actionLabel="Go to learning"
          actionHref="/dashboard/learning"
        />
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Want live sessions?
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                The Industry-Led programme adds a structured 15-day schedule with
                sessions run by working professionals, guided assignments and career
                guidance.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/programs">Compare programmes</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Your 15-day Industry-Led programme. Sessions run each evening."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Schedule" },
        ]}
        action={<Badge variant="warning">Demo schedule</Badge>}
      />

      {/* Trainer */}
      {trainer && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
                {trainer.initials}
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {trainer.name}
                  <Badge variant="warning">Demo profile</Badge>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {trainer.role} · {trainer.industry} · {trainer.experience}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Specialisation: {trainer.specialization}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={trainer.linkedin} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> LinkedIn
              </a>
            </Button>
          </div>
        </section>
      )}

      {/* Phases */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {FIFTEEN_DAY_PHASES.map((phase) => (
          <div
            key={phase.label}
            className="rounded-xl border border-border bg-card p-4 shadow-soft"
          >
            <p className="font-mono text-[0.7rem] font-semibold text-primary">
              {phase.label}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{phase.title}</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <section className="hidden rounded-2xl border border-border bg-card shadow-soft md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(item.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  Day {String(item.day).padStart(2, "0")}
                </TableCell>
                <TableCell>
                  <span className="block font-medium text-foreground">{item.topic}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.phase}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {trainer?.name}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {item.time}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {schedule.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-mono text-xs font-semibold text-primary">
                Day {String(item.day).padStart(2, "0")}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{item.topic}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.phase}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="mt-0.5 text-foreground">{formatDate(item.date)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Time</dt>
                <dd className="mt-0.5 text-foreground">{item.time}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Trainer</dt>
                <dd className="mt-0.5 text-foreground">{trainer?.name}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
