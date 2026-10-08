"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Info,
  Minus,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { READINESS_WEIGHTS, readinessBand } from "@/lib/readiness";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  success: "text-success",
  primary: "text-primary",
  warning: "text-warning-ink",
  muted: "text-muted-foreground",
};

export function ReadinessView() {
  const { ready, student } = useStudentContext();
  const career = useCareerContext();

  if (!ready || !career.ready) {
    return <LoadingState label="Calculating your readiness" rows={3} />;
  }

  const { readiness } = career;
  const band = readinessBand(readiness.score);

  return (
    <div>
      <PageHeader
        title="Career Readiness"
        description="One score, measured across five areas. Every number below is derived from work you actually did — there is nothing here you did not earn."
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/dashboard/passport">
              View Career Passport <ArrowRight className="cta-arrow" />
            </Link>
          </Button>
        }
      />

      {/* ── Headline score ───────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-soft">
          <p className="eyebrow">Your score</p>
          <p className="mt-4 font-display text-6xl font-semibold tracking-tight text-foreground">
            <AnimatedCounter value={readiness.score} />
            <span className="text-2xl font-normal text-muted-foreground">
              {" "}
              / 100
            </span>
          </p>
          <p className={cn("mt-3 text-sm font-semibold", TONE_CLASS[band.tone])}>
            {band.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {band.blurb}
          </p>

          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-baseline justify-between text-[0.8rem]">
              <span className="text-muted-foreground">Evidence coverage</span>
              <span className="font-mono font-semibold text-foreground">
                {readiness.evidenceCoverage}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${readiness.evidenceCoverage}%` }}
              />
            </div>
            <p className="mt-2.5 text-[0.72rem] leading-relaxed text-muted-foreground">
              How many of the five areas you have generated any evidence for.
            </p>
          </div>
        </div>

        {/* ── Breakdown ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-soft">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Performance areas</p>
            <p className="text-[0.72rem] text-muted-foreground">
              Weighted contribution shown
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {readiness.breakdown.map((area) => (
              <div key={area.area}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.88rem] font-medium text-foreground">
                      {area.label}
                    </span>
                    <Badge variant="outline" className="font-mono text-[0.65rem]">
                      {Math.round(READINESS_WEIGHTS[area.area] * 100)}%
                    </Badge>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold",
                      area.hasEvidence ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {area.hasEvidence ? area.score : "—"}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700",
                      area.score >= 75
                        ? "bg-success"
                        : area.score >= 50
                          ? "bg-primary"
                          : "bg-warning",
                    )}
                    style={{ width: `${area.score}%` }}
                  />
                </div>

                <p className="mt-2 text-[0.76rem] leading-relaxed text-muted-foreground">
                  {area.basis}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Strengths and next steps ─────────────────────────────────── */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Your strengths
            </h2>
          </div>

          {readiness.strengths.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {readiness.strengths.map((strength) => (
                <li
                  key={strength}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No area has reached 75 yet. Strengths appear here as soon as one
              does.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Improve next
            </h2>
          </div>

          {readiness.improveNext.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {readiness.improveNext.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <ArrowRight
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex items-start gap-2.5 text-sm text-muted-foreground">
              <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Every area is above 65. Keep the evidence current.
            </p>
          )}
        </div>
      </div>

      {/* ── How it is calculated ─────────────────────────────────────── */}
      <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-[0.9rem] font-semibold text-foreground">
            How this is calculated
          </h2>
        </div>
        <div className="mt-4 grid gap-3 text-[0.82rem] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="font-semibold text-foreground">
              Technical Skills (25%)
            </span>{" "}
            — the mean of your best attempt on each module assessment, scaled by
            how many you have attempted.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Practical Application (20%)
            </span>{" "}
            — the review status of your practical activity, plus module
            completion.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Problem Solving (20%)
            </span>{" "}
            — your final assessment and any industry challenge scores, with the
            challenge weighted higher.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Communication (15%)
            </span>{" "}
            — clarity and structure across your most recent mock interviews.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Project Execution (20%)
            </span>{" "}
            — the average score of your evaluated projects.
          </p>
          <p>
            An unattempted assessment counts as missing evidence rather than a
            zero, so the score never punishes you for work you have not reached
            yet.
          </p>
        </div>

        <div className="mt-5 flex items-start gap-3 border-t border-border pt-4">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-[0.76rem] leading-relaxed text-muted-foreground">
            This score reflects platform activity and assessment data. It is not
            a guarantee of employment, and Roystian Foundation does not present
            it as one to any employer or institution.
          </p>
        </div>
      </div>

      {student?.domainId == null && (
        <p className="mt-5 text-sm text-muted-foreground">
          Choose a domain to start generating evidence.{" "}
          <Link href="/start/domain" className="font-semibold text-primary">
            Pick a domain
          </Link>
          .
        </p>
      )}
    </div>
  );
}
