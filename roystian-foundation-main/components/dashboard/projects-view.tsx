"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Lock,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isProjectUnlocked } from "@/data/projects";
import { useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { cn } from "@/lib/utils";
import type { ProjectBrief, ProjectSubmission } from "@/types";

const STATUS_LABEL: Record<ProjectSubmission["status"], string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  submitted: "Submitted",
  evaluated: "Evaluated",
};

export function ProjectsView() {
  const { ready, student, program, domain } = useStudentContext();
  const career = useCareerContext();

  if (!ready || !career.ready) {
    return <LoadingState label="Loading your projects" rows={3} />;
  }

  if (!domain) {
    return (
      <div>
        <PageHeader title="Projects" />
        <EmptyState
          title="Choose a domain first"
          description="Project briefs are specific to your domain. Pick one to see yours."
          actionLabel="Choose a domain"
          actionHref="/start/domain"
        />
      </div>
    );
  }

  const submissionFor = (brief: ProjectBrief) =>
    career.projects.find((p) => p.projectId === brief.id) ?? null;

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`Industry-style briefs for ${domain.name}. You receive a problem statement, a dataset, requirements and the evaluation criteria — and produce analysis, recommendations and a report.`}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {career.briefs.map((brief) => {
          const submission = submissionFor(brief);
          const unlocked = isProjectUnlocked(brief, student?.programId);
          const status = submission?.status ?? "not-started";

          return (
            <div
              key={brief.id}
              className={cn(
                "flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft",
                !unlocked && "opacity-75",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge
                  variant={brief.tier === "advanced" ? "secondary" : "outline"}
                  className="capitalize"
                >
                  {brief.tier}
                </Badge>
                <div className="flex items-center gap-2">
                  {submission?.overallScore != null && (
                    <span className="font-mono text-sm font-semibold text-success">
                      {submission.overallScore}%
                    </span>
                  )}
                  <Badge
                    variant={
                      status === "evaluated"
                        ? "success"
                        : status === "submitted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {STATUS_LABEL[status]}
                  </Badge>
                </div>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
                {brief.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {brief.scenario}
              </p>

              <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-[0.78rem] sm:grid-cols-3">
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Database className="h-3 w-3" aria-hidden="true" /> Dataset
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {brief.dataset.format}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Target className="h-3 w-3" aria-hidden="true" /> Criteria
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {brief.evaluationCriteria.length} weighted
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" /> Effort
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    ~{brief.estimatedHours} hours
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {brief.skillsDemonstrated.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex-1" />

              {unlocked ? (
                <Button asChild className="group mt-4 w-full">
                  <Link href={`/dashboard/projects/${brief.id}`}>
                    {status === "not-started"
                      ? "Open the brief"
                      : status === "evaluated"
                        ? "View evaluation"
                        : "Continue"}
                    <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                  <p className="flex items-center gap-2 text-[0.82rem] font-medium text-foreground">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Included with Industry Sprint
                  </p>
                  <p className="mt-1.5 text-[0.76rem] leading-relaxed text-muted-foreground">
                    The advanced brief is part of the Industry-Led programme.
                    You are currently on {program?.marketingName ?? "Career Starter"}.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
        <FileText
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          Evaluated projects feed the Project Execution component of your Career
          Readiness Score and can unlock the Project Execution badge. They also
          appear on your public Career Passport if you choose to show them.
        </p>
      </div>

      {career.projects.some((p) => p.status === "evaluated") && (
        <div className="mt-5 flex items-center gap-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          You have evaluated project work on record.
        </div>
      )}
    </div>
  );
}
