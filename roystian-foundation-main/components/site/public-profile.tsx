"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  GraduationCap,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDomain, getDomainAssessments } from "@/data/domains";
import { getProject } from "@/data/projects";
import { readinessBand } from "@/lib/readiness";
import { cn, formatDate, initials } from "@/lib/utils";
import type { CareerReadiness, PublicProfileView } from "@/types";

/**
 * The public Career Passport.
 *
 * Rendered entirely from the student's real records and filtered by the
 * visibility flags they set. An unpublished passport is indistinguishable
 * from a missing one, so a private profile cannot be confirmed to exist by
 * guessing its URL.
 */
export function PublicProfile({ slug }: { slug: string }) {
  const [view, setView] = React.useState<PublicProfileView | null | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/profiles/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : { profile: null }))
      .then((data) => active && setView(data.profile ?? null))
      .catch(() => active && setView(null));
    return () => {
      active = false;
    };
  }, [slug]);

  if (view === undefined) return <LoadingState label="Loading profile" rows={4} />;

  if (!view) {
    return (
      <SiteShell>
        <div className="container py-28">
          <EmptyState
            icon={UserRound}
            title="Profile not found"
            description="This Career Passport does not exist or is not published."
            actionLabel="Back to Roystian Foundation"
            actionHref="/"
          />
        </div>
      </SiteShell>
    );
  }

  // The server only includes the sections the student chose to share.
  const { student, visibility, badges, certificate } = view;
  const passport = { headline: view.headline, about: view.about };
  const readiness: Pick<CareerReadiness, "score" | "breakdown"> = view.readiness ?? { score: 0, breakdown: [] };
  const domain = getDomain(student.domainId);
  const assessments = student.domainId ? getDomainAssessments(student.domainId) : [];
  const passedAssessments = assessments.filter((a) =>
    view.assessments?.passed.some((p) => p.id === a.id),
  );
  const progress = {
    finalAttempt:
      view.assessments?.finalPercentage != null
        ? { passed: true, percentage: view.assessments.finalPercentage }
        : null,
    moduleAttempts: Object.fromEntries(
      (view.assessments?.passed ?? []).map((p) => [p.id, { percentage: p.percentage }]),
    ),
  };
  const evaluatedProjects = view.projects;
  const band = readinessBand(readiness.score);

  return (
    <SiteShell>
      <div className="container max-w-5xl py-14 sm:py-20">
        {/* ── Identity ───────────────────────────────────────────────── */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-2xl font-semibold text-primary">
            {initials(student.name)}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {student.name}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {passport.headline}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-muted-foreground">
              {student.college && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.college}
                </span>
              )}
              {student.course && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.course}
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.email}
                </span>
              )}
            </div>
          </div>
        </header>

        {passport.about && (
          <p className="mt-8 max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground">
            {passport.about}
          </p>
        )}

        {/* ── Readiness ──────────────────────────────────────────────── */}
        {visibility.readiness && view.readiness && (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Career Readiness</h2>
            <div className="grid gap-5 sm:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="font-display text-5xl font-semibold tracking-tight text-foreground">
                  {readiness.score}
                  <span className="text-xl font-normal text-muted-foreground">
                    {" "}
                    / 100
                  </span>
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {band.label}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="space-y-3">
                  {readiness.breakdown.map((area) => (
                    <div key={area.area}>
                      <div className="flex items-baseline justify-between text-[0.8rem]">
                        <span className="text-muted-foreground">{area.label}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {area.hasEvidence ? area.score : "—"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            area.score >= 75
                              ? "bg-success"
                              : area.score >= 50
                                ? "bg-primary"
                                : "bg-warning",
                          )}
                          style={{ width: `${area.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-[0.72rem] leading-relaxed text-muted-foreground">
              Derived from platform activity and assessment data. Not a
              guarantee of employment.
            </p>
          </section>
        )}

        {/* ── Badges ─────────────────────────────────────────────────── */}
        {visibility.badges && badges.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Verified skills</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex gap-3.5 rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success">
                    <DynamicIcon name={badge.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.85rem] font-semibold text-foreground">
                      {badge.displayName}
                    </p>
                    <p className="mt-0.5 text-[0.74rem] leading-relaxed text-muted-foreground">
                      {badge.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Projects ───────────────────────────────────────────────── */}
        {visibility.projects && evaluatedProjects.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Project evidence</h2>
            <div className="space-y-4">
              {evaluatedProjects.map((submitted) => {
                const brief = getProject(submitted.projectId);
                if (!brief) return null;
                return (
                  <article
                    key={submitted.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                          {brief.title}
                        </h3>
                        <p className="mt-1 text-[0.8rem] text-muted-foreground">
                          {brief.dataset.rows} · {brief.dataset.format}
                        </p>
                      </div>
                      <Badge variant="success" className="font-mono">
                        {submitted.overallScore}%
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {brief.problemStatement}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {brief.skillsDemonstrated.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Assessments ────────────────────────────────────────────── */}
        {visibility.assessments && passedAssessments.length > 0 && (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Assessment record</h2>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {passedAssessments.length} of {assessments.length}
                </span>{" "}
                module assessments passed
                {domain ? ` in ${domain.name}` : ""}
                {progress?.finalAttempt?.passed &&
                  `, with the final assessment passed at ${progress.finalAttempt.percentage}%`}
                .
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {passedAssessments.slice(0, 10).map((assessment) => {
                  const attempt = progress?.moduleAttempts?.[assessment.id];
                  return (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5"
                    >
                      <span className="truncate text-[0.8rem] text-muted-foreground">
                        {assessment.title.replace(/^Module \d+ — /, "")}
                      </span>
                      <span className="shrink-0 font-mono text-[0.78rem] font-semibold text-success">
                        {attempt?.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Certificate ────────────────────────────────────────────── */}
        {visibility.certificate && certificate && (
          <section className="mt-12">
            <h2 className="eyebrow mb-4">Credential</h2>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.92rem] font-semibold text-foreground">
                    {certificate.domainName} — {certificate.programName}
                  </p>
                  <p className="mt-1 font-mono text-[0.76rem] text-muted-foreground">
                    {certificate.id} · Issued {formatDate(certificate.issueDate)}
                  </p>
                </div>
              </div>

              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/verify/${certificate.id}`}>
                  Verify <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* ── Footer note ────────────────────────────────────────────── */}
        <footer className="mt-14 flex items-start gap-3 border-t border-border pt-8">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-[0.76rem] leading-relaxed text-muted-foreground">
            This Career Passport is published by{" "}
            <Link href="/" className="font-semibold text-primary">
              Roystian Foundation
            </Link>
            , a Section 8 non-profit. Every figure is derived from work the
            student completed on the platform. Certificates can be verified
            independently at{" "}
            <Link href="/verify" className="font-semibold text-primary">
              /verify
            </Link>
            .
          </p>
        </footer>
      </div>
    </SiteShell>
  );
}
