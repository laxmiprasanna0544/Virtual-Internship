"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  Lock,
  PlayCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentContext } from "@/lib/use-student";
import { cn } from "@/lib/utils";

export function LearningList() {
  const ctx = useStudentContext();

  if (!ctx.ready) return <LoadingState label="Loading modules" rows={4} />;

  if (!ctx.domain || !ctx.student) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No learning track yet"
        description="Choose a domain to unlock your learning modules."
        actionLabel="Choose a domain"
        actionHref="/start/domain"
      />
    );
  }

  const { domain, progress, summary } = ctx;
  const completed = progress?.completedModules ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        description={`${domain.name} — ${domain.modules.length} modules. Work through them in order, or jump to any module you need.`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Learning" }]}
        action={
          ctx.nextModule ? (
            <Button asChild>
              <Link href={`/dashboard/learning/${ctx.nextModule.id}`}>
                <PlayCircle /> Continue
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">
            {summary.modulesCompleted} of {summary.moduleTotal} modules completed
          </p>
          <p className="font-display text-lg font-semibold text-foreground">
            {summary.modulePercent}%
          </p>
        </div>
        <Progress
          value={summary.modulePercent}
          className="mt-3"
          aria-label="Module completion"
        />
      </section>

      <ol className="grid gap-4 sm:grid-cols-2">
        {domain.modules.map((module) => {
          const isDone = completed.includes(module.id);
          const attempt = progress?.moduleAttempts?.[module.assessmentId];
          const isNext = ctx.nextModule?.id === module.id;

          return (
            <li key={module.id}>
              <Link
                href={`/dashboard/learning/${module.id}`}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isDone
                    ? "border-success/30"
                    : isNext
                      ? "border-primary/40"
                      : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">
                    Module {String(module.number).padStart(2, "0")}
                  </span>
                  {isDone ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </Badge>
                  ) : isNext ? (
                    <Badge>In progress</Badge>
                  ) : (
                    <Badge variant="secondary">Not started</Badge>
                  )}
                </div>

                <h2 className="mt-2.5 text-[0.95rem] font-semibold text-foreground">
                  {module.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {module.summary}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5 text-[0.7rem] text-muted-foreground">
                  <li className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <BookOpen className="h-3 w-3" aria-hidden="true" />
                    {module.readMinutes} min read
                  </li>
                  <li className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <FileText className="h-3 w-3" aria-hidden="true" />
                    {module.resources.length} resources
                  </li>
                  <li className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <ClipboardList className="h-3 w-3" aria-hidden="true" />
                    {attempt ? `${attempt.percentage}%` : "Assessment"}
                  </li>
                </ul>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {isDone ? "Review module" : "Open module"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <section className="rounded-2xl border border-border bg-muted/40 p-5">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Completing every module is one of the certificate requirements. You also
            need to pass each module assessment, submit the practical task and pass the
            final assessment.
          </p>
        </div>
      </section>
    </div>
  );
}
