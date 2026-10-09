"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, GraduationCap, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDomainAssessments } from "@/data/domains";
import { useStudentContext } from "@/lib/use-student";
import { formatDate } from "@/lib/utils";

export function AssessmentsList() {
  const ctx = useStudentContext();

  if (!ctx.ready) return <LoadingState label="Loading assessments" rows={4} />;

  if (!ctx.domain) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No assessments yet"
        description="Choose a domain to unlock module assessments and the final assessment."
        actionLabel="Choose a domain"
        actionHref="/start/domain"
      />
    );
  }

  const assessments = getDomainAssessments(ctx.domain.id);
  const { progress, summary, finalAssessment } = ctx;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Short assessments after every module, plus one final assessment. The pass mark is 70% and retakes are unlimited."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments" },
        ]}
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">
            {summary.assessmentsPassed} of {summary.assessmentTotal} module assessments
            passed
          </p>
          <p className="font-display text-lg font-semibold text-foreground">
            {summary.assessmentTotal
              ? Math.round((summary.assessmentsPassed / summary.assessmentTotal) * 100)
              : 0}
            %
          </p>
        </div>
        <Progress
          value={
            summary.assessmentTotal
              ? (summary.assessmentsPassed / summary.assessmentTotal) * 100
              : 0
          }
          className="mt-3"
          aria-label="Assessment progress"
        />
      </section>

      {/* Final assessment */}
      {finalAssessment && (
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <GraduationCap className="h-3 w-3" /> Final Assessment
                </Badge>
                <Badge variant="warning">Demo Assessment</Badge>
                {progress?.finalAttempt && (
                  <StatusBadge
                    status={progress.finalAttempt.passed ? "completed" : "pending"}
                  />
                )}
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
                {finalAssessment.title}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                {finalAssessment.description}
              </p>
              {progress?.finalAttempt && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Best score: {progress.finalAttempt.percentage}% (
                  {progress.finalAttempt.score}/{progress.finalAttempt.total}) ·{" "}
                  {formatDate(progress.finalAttempt.submittedAt)}
                </p>
              )}
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/dashboard/assessments/final">
                {progress?.finalAttempt ? (
                  <>
                    <RotateCcw /> Retake final
                  </>
                ) : (
                  <>
                    Start final assessment <ArrowRight />
                  </>
                )}
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Module assessments */}
      <ol className="grid gap-4 sm:grid-cols-2">
        {assessments.map((assessment) => {
          const attempt = progress?.moduleAttempts?.[assessment.id];
          return (
            <li key={assessment.id}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {assessment.questionCount} questions
                  </span>
                  {attempt ? (
                    <Badge variant={attempt.passed ? "success" : "warning"}>
                      {attempt.passed ? "Passed" : "Needs Improvement"} ·{" "}
                      {attempt.percentage}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not attempted</Badge>
                  )}
                </div>
                <h2 className="mt-2.5 text-[0.95rem] font-semibold text-foreground">
                  {assessment.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {assessment.description}
                </p>
                {attempt && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last attempt {formatDate(attempt.submittedAt)} · {attempt.score}/
                    {attempt.total} correct
                  </p>
                )}
                <Button
                  asChild
                  variant={attempt?.passed ? "outline" : "default"}
                  className="mt-4"
                >
                  <Link href={`/dashboard/assessments/${assessment.id}`}>
                    {attempt ? "Retake" : "Start"} assessment <ArrowRight />
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
