"use client";

import { Lightbulb, Printer, TrendingDown, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useCampusContext } from "@/lib/campus";
import { useSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { SkillSignal } from "@/types";

export function SkillGapView() {
  const { user } = useSession();
  const campus = useCampusContext(user?.collegeId ?? user?.id ?? null);

  if (!campus.ready) return <LoadingState label="Generating report" rows={3} />;

  if (!campus.report || campus.cohort.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Not enough data yet"
        description="A skill gap report needs students with recorded activity. It will generate automatically once your cohort is underway."
        actionLabel="Back to overview"
        actionHref="/campus"
      />
    );
  }

  const { report } = campus;

  return (
    <div>
      <PageHeader
        title="College Skill Gap Report"
        description={`${report.collegeName} · ${report.cohortSize} students · generated ${formatDate(report.generatedAt)}`}
        action={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SignalPanel
          title="Student strengths"
          icon={TrendingUp}
          tone="success"
          signals={report.strengths}
          emptyNote="No area has enough recorded evidence yet."
        />
        <SignalPanel
          title="Skill gaps"
          icon={TrendingDown}
          tone="warning"
          signals={report.gaps}
          emptyNote="No gaps identified yet."
        />
      </div>

      {/* ── Interventions ────────────────────────────────────────────── */}
      {report.recommendedInterventions.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2.5">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Recommended interventions
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {report.recommendedInterventions.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <h3 className="text-[0.95rem] font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {item.rationale}
                </p>
                <p className="mt-4 border-t border-border pt-3 text-[0.78rem] font-medium text-primary">
                  {item.format}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-[0.76rem] leading-relaxed text-muted-foreground">
        Signals are cohort averages across the five areas the Career Readiness
        Score measures, counting only students who have generated evidence in
        that area. The student count beside each figure shows how many students
        it is based on — a signal drawn from three students should be read
        differently from one drawn from three hundred.
      </p>
    </div>
  );
}

function SignalPanel({
  title,
  icon: Icon,
  tone,
  signals,
  emptyNote,
}: {
  title: string;
  icon: typeof TrendingUp;
  tone: "success" | "warning";
  signals: SkillSignal[];
  emptyNote: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2.5">
        <Icon
          className={
            tone === "success"
              ? "h-4 w-4 text-success"
              : "h-4 w-4 text-warning-ink"
          }
          aria-hidden="true"
        />
        <h2 className="text-[0.95rem] font-semibold text-foreground">{title}</h2>
      </div>

      {signals.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyNote}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {signals.map((signal) => (
            <div key={signal.skill}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.88rem] font-medium text-foreground">
                  {signal.skill}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {signal.score}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    tone === "success"
                      ? "h-full rounded-full bg-success"
                      : "h-full rounded-full bg-warning"
                  }
                  style={{ width: `${signal.score}%` }}
                />
              </div>
              <p className="mt-1.5 text-[0.74rem] text-muted-foreground">
                Based on {signal.studentCount} student
                {signal.studentCount === 1 ? "" : "s"} with recorded evidence
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
