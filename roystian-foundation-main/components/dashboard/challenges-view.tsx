"use client";

import * as React from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send, Trophy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { challengesForDomain, getChallenge } from "@/data/challenges";
import { submitChallengeEntry, useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { delay } from "@/lib/api";
import type { Challenge } from "@/types";

const MIN_APPROACH = 120;
const MIN_SOLUTION = 200;

export function ChallengesView() {
  const { ready, student, domain } = useStudentContext();
  const career = useCareerContext();

  const [active, setActive] = React.useState<Challenge | null>(null);
  const [approach, setApproach] = React.useState("");
  const [solution, setSolution] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!ready || !career.ready) {
    return <LoadingState label="Loading challenges" rows={3} />;
  }

  const { recommended, others } = challengesForDomain(domain?.id);
  const entryFor = (id: string) =>
    career.challenges.find((c) => c.challengeId === id) ?? null;

  function open(challenge: Challenge) {
    const entry = entryFor(challenge.id);
    setApproach(entry?.approach ?? "");
    setSolution(entry?.solution ?? "");
    setRepoUrl(entry?.repoUrl ?? "");
    setActive(challenge);
  }

  async function handleSubmit() {
    if (!student || !active) return;
    if (approach.trim().length < MIN_APPROACH) {
      toast.error("Describe your approach", {
        description: `At least ${MIN_APPROACH} characters on how you tackled it.`,
      });
      return;
    }
    if (solution.trim().length < MIN_SOLUTION) {
      toast.error("Your solution is too short", {
        description: `At least ${MIN_SOLUTION} characters, including limitations.`,
      });
      return;
    }

    setBusy(true);
    await delay(500);
    submitChallengeEntry(
      student.id,
      active.id,
      approach,
      solution,
      repoUrl.trim() || null,
    );
    setBusy(false);
    setActive(null);
    toast.success("Entry submitted", {
      description: "It will be evaluated against the published criteria.",
    });
  }

  /* ------------------------- Entry form ------------------------- */
  if (active) {
    const entry = entryFor(active.id);
    const locked = entry?.status === "evaluated" || entry?.status === "submitted";

    return (
      <div>
        <PageHeader
          title={active.title}
          description={active.summary}
          breadcrumbs={[
            { label: "Challenges", href: "/dashboard/challenges" },
            { label: active.title },
          ]}
          action={
            <Button variant="outline" onClick={() => setActive(null)}>
              <ArrowLeft /> All challenges
            </Button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                The brief
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {active.brief}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {active.difficulty}
                </Badge>
                <Badge variant="secondary">{active.durationLabel}</Badge>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Requirements
              </h2>
              <ol className="mt-4 space-y-2.5">
                {active.requirements.map((req, index) => (
                  <li key={req} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-border bg-muted/30 p-6">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Judged on
              </h2>
              <ul className="mt-4 space-y-2">
                {active.evaluationCriteria.map((criterion) => (
                  <li
                    key={criterion}
                    className="flex items-start gap-2.5 text-[0.84rem] leading-relaxed text-muted-foreground"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {criterion}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Your entry
            </h2>

            {entry?.status === "evaluated" && (
              <div className="mt-4 rounded-xl border border-success/30 bg-success/[0.06] p-4">
                <p className="font-display text-3xl font-semibold text-foreground">
                  {entry.score}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / 100
                  </span>
                </p>
                {entry.feedback && (
                  <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">
                    {entry.feedback}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="approach">Your approach</Label>
                <Textarea
                  id="approach"
                  rows={5}
                  className="mt-2"
                  disabled={locked}
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  placeholder="How did you frame the problem, and why that way?"
                />
              </div>

              <div>
                <Label htmlFor="solution">Your solution</Label>
                <Textarea
                  id="solution"
                  rows={9}
                  className="mt-2"
                  disabled={locked}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="What you produced, what it shows, and where it should not be trusted."
                />
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  {solution.trim().length} characters
                </p>
              </div>

              <div>
                <Label htmlFor="challenge-repo">
                  Link{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="challenge-repo"
                  className="mt-2"
                  disabled={locked}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/…"
                />
              </div>

              {locked ? (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="flex items-center gap-2 text-[0.85rem] font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                    Submitted
                  </p>
                  <p className="mt-1.5 text-[0.76rem] leading-relaxed text-muted-foreground">
                    Entries are locked once submitted for evaluation.
                  </p>
                </div>
              ) : (
                <Button className="w-full" onClick={handleSubmit} disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send /> Submit entry
                    </>
                  )}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ------------------------- Listing ------------------------- */
  return (
    <div>
      <PageHeader
        title="Roystian Industry Challenge"
        description="Open-ended problems outside the curriculum. A score of 70% or above earns the Industry Challenge badge and feeds the Problem Solving component of your readiness score."
      />

      {recommended.length > 0 && (
        <section>
          <h2 className="eyebrow mb-4">Recommended for {domain?.shortName}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recommended.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                entry={entryFor(challenge.id)}
                onOpen={() => open(challenge)}
              />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className={recommended.length > 0 ? "mt-10" : undefined}>
          <h2 className="eyebrow mb-4">Also open to you</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                entry={entryFor(challenge.id)}
                onOpen={() => open(challenge)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
  entry,
  onOpen,
}: {
  challenge: Challenge;
  entry: ReturnType<typeof useCareerContext>["challenges"][number] | null;
  onOpen: () => void;
}) {
  return (
    <div className="lift-card flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <DynamicIcon name={challenge.icon} className="h-5 w-5" />
        </span>
        {entry?.status === "evaluated" && entry.score != null ? (
          <Badge variant="success" className="font-mono">
            <Trophy className="mr-1 h-3 w-3" aria-hidden="true" />
            {entry.score}%
          </Badge>
        ) : entry?.status === "submitted" ? (
          <Badge variant="secondary">Submitted</Badge>
        ) : (
          <Badge variant="outline" className="capitalize">
            {challenge.difficulty}
          </Badge>
        )}
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
        {challenge.title}
      </h3>
      <p className="mt-1.5 text-[0.86rem] font-medium text-primary">
        {challenge.summary}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {challenge.brief}
      </p>

      <Button variant="outline" className="mt-5 w-full" onClick={onOpen}>
        {entry ? "View entry" : "Open challenge"}
      </Button>
    </div>
  );
}
