"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/states";
import { EXPERIENCE_LEVELS, EDUCATION_LEVELS } from "@/data/content";
import { getDraft, saveDraft } from "@/lib/onboarding";
import { buildRecommendation } from "@/lib/recommendation";
import { getDomain } from "@/data/domains";
import { cn } from "@/lib/utils";
import type { ExperienceLevel, OnboardingDraft } from "@/types";

export function ExperienceStep() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<OnboardingDraft | null>(null);

  React.useEffect(() => {
    setDraft(getDraft());
  }, []);

  if (!draft) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!draft.domainId) {
    return (
      <EmptyState
        title="Choose a domain first"
        description="We need a domain before we can recommend a learning track for you."
        actionLabel="Choose a domain"
        actionHref="/start/domain"
      />
    );
  }

  const domain = getDomain(draft.domainId);
  const recommendation = buildRecommendation(
    draft.domainId,
    draft.experience,
    draft.educationLevel || null,
  );

  function choose(level: ExperienceLevel) {
    const next = saveDraft({ experience: level });
    setDraft(next);
  }

  return (
    <div className="space-y-8">
      {domain && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <DynamicIcon name={domain.icon} className="h-[1.1rem] w-[1.1rem]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{domain.name}</p>
            <p className="truncate text-xs text-muted-foreground">{domain.tagline}</p>
          </div>
          <Link
            href="/start/domain"
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Change
          </Link>
        </div>
      )}

      <ul
        className="grid gap-4 lg:grid-cols-3"
        role="radiogroup"
        aria-label="Experience level"
      >
        {EXPERIENCE_LEVELS.map((level) => {
          const active = draft.experience === level.value;
          return (
            <li key={level.value}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(level.value)}
                className={cn(
                  "flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary/[0.05] shadow-card"
                    : "border-border bg-card shadow-soft hover:-translate-y-0.5 hover:border-primary/35",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.95rem] font-semibold text-foreground">
                    {level.label}
                  </span>
                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <span className="mt-2 block flex-1 text-sm leading-relaxed text-muted-foreground">
                  {level.description}
                </span>
                <span className="mt-4 block border-t border-border pt-3 text-xs text-muted-foreground">
                  {level.difficulty} · {level.effort}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {recommendation && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-7"
        >
          <Badge className="mb-4">
            <Sparkles className="h-3 w-3" /> Your Recommended Learning Track
          </Badge>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-background px-2.5 py-1 font-medium text-foreground">
              {EDUCATION_LEVELS.find((e) => e.value === draft.educationLevel)?.label ??
                "Student"}
            </span>
            <span aria-hidden="true">→</span>
            <span className="rounded-md bg-background px-2.5 py-1 font-medium text-foreground">
              {recommendation.domain.name}
            </span>
            <span aria-hidden="true">→</span>
            <span className="rounded-md bg-background px-2.5 py-1 font-medium text-foreground">
              {recommendation.experienceLabel}
            </span>
          </div>

          <h2 className="mt-5 font-display text-xl font-semibold text-foreground">
            {recommendation.trackName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {recommendation.rationale}
          </p>

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Difficulty", value: recommendation.difficulty },
              { label: "Estimated effort", value: recommendation.effort },
              { label: "Modules", value: `${recommendation.moduleCount} modules` },
              { label: "Assessment style", value: recommendation.assessmentStyle },
            ].map((row) => (
              <div key={row.label} className="border-b border-border/70 pb-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{row.value}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Practical activity
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {recommendation.practicalActivity}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <div className="flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          You can change your domain or level any time before checkout.
        </p>
        <Button
          size="lg"
          disabled={!draft.experience}
          onClick={() => router.push("/start/program")}
        >
          Continue to programme <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
