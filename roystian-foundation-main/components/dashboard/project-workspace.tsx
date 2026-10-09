"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  FileCheck2,
  ListChecks,
  Lock,
  Loader2,
  Send,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProject, isProjectUnlocked } from "@/data/projects";
import {
  saveProjectDraft,
  startProject,
  submitProject,
  useCareerContext,
} from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";

/** A submission needs real substance before it can be sent for evaluation. */
const MIN_ANALYSIS = 200;
const MIN_RECOMMENDATIONS = 80;

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const { ready, student } = useStudentContext();
  const career = useCareerContext();
  const brief = getProject(projectId);

  const submission = career.projects.find((p) => p.projectId === projectId) ?? null;

  const [analysis, setAnalysis] = React.useState("");
  const [recommendations, setRecommendations] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Seed the editors from the stored draft once, then let the user type freely.
  React.useEffect(() => {
    if (hydrated || !submission) return;
    setAnalysis(submission.analysis);
    setRecommendations(submission.recommendations);
    setRepoUrl(submission.repoUrl ?? "");
    setHydrated(true);
  }, [submission, hydrated]);

  if (!ready || !career.ready) {
    return <LoadingState label="Loading the brief" rows={4} />;
  }

  if (!brief) {
    return (
      <EmptyState
        title="Project not found"
        description="This brief does not exist, or it belongs to a different domain."
        actionLabel="Back to projects"
        actionHref="/dashboard/projects"
      />
    );
  }

  const unlocked = isProjectUnlocked(brief, student?.programId);
  const locked = submission?.status === "submitted" || submission?.status === "evaluated";

  async function handleStart() {
    if (!student || !brief) return;
    setBusy(true);
    try {
      await startProject(brief);
      toast.success("Project started", { description: "Save your draft as you work." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDraft() {
    if (!submission) return;
    setBusy(true);
    try {
      await saveProjectDraft(submission.id, {
        analysis,
        recommendations,
        repoUrl: repoUrl.trim() || null,
      });
      toast.success("Draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!submission) return;
    if (analysis.trim().length < MIN_ANALYSIS) {
      toast.error("Analysis is too short", {
        description: `Write at least ${MIN_ANALYSIS} characters explaining your approach and reasoning.`,
      });
      return;
    }
    if (recommendations.trim().length < MIN_RECOMMENDATIONS) {
      toast.error("Recommendations are too short", {
        description: "State what you would actually do with these findings.",
      });
      return;
    }

    setBusy(true);
    try {
      await saveProjectDraft(submission.id, {
        analysis,
        recommendations,
        repoUrl: repoUrl.trim() || null,
      });
      await submitProject(submission.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      return;
    } finally {
      setBusy(false);
    }
    toast.success("Project submitted", {
      description: "It will be evaluated against the published criteria.",
    });
  }

  return (
    <div>
      <PageHeader
        title={brief.title}
        description={brief.scenario}
        breadcrumbs={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: brief.title },
        ]}
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/projects">
              <ArrowLeft /> All projects
            </Link>
          </Button>
        }
      />

      {!unlocked && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              This is an Industry Sprint brief
            </p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
              You can read it in full, but submission is part of the
              Industry-Led programme.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── The brief ──────────────────────────────────────────────── */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Problem statement
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {brief.problemStatement}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Your dataset
              </h2>
            </div>
            <p className="mt-3 font-mono text-[0.82rem] text-foreground">
              {brief.dataset.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {brief.dataset.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{brief.dataset.rows}</Badge>
              <Badge variant="outline">{brief.dataset.format}</Badge>
            </div>
            <p className="mt-4 border-t border-border pt-3 text-[0.72rem] leading-relaxed text-muted-foreground">
              In this demo environment the dataset is described rather than
              downloadable.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Requirements
              </h2>
            </div>
            <ol className="mt-4 space-y-2.5">
              {brief.requirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground">{requirement}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Deliverables
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {brief.deliverables.map((deliverable) => (
                <li key={deliverable} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{deliverable}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Criteria + workspace ───────────────────────────────────── */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                How this is evaluated
              </h2>
            </div>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">
              Published before you start, so nothing is judged on a criterion
              you could not see.
            </p>

            <div className="mt-5 space-y-4">
              {brief.evaluationCriteria.map((criterion) => {
                const score = submission?.criterionScores?.[criterion.label];
                return (
                  <div key={criterion.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[0.85rem] font-medium text-foreground">
                        {criterion.label}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {score != null ? (
                          <span className="font-semibold text-success">
                            {score}%
                          </span>
                        ) : (
                          `${criterion.weight}%`
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.76rem] leading-relaxed text-muted-foreground">
                      {criterion.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Evaluation result */}
          {submission?.status === "evaluated" && (
            <section className="rounded-2xl border border-success/30 bg-success/[0.06] p-6">
              <p className="eyebrow">Evaluated</p>
              <p className="mt-3 font-display text-4xl font-semibold text-foreground">
                {submission.overallScore}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  / 100
                </span>
              </p>
              {submission.feedback && (
                <p className="mt-4 border-t border-success/20 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {submission.feedback}
                </p>
              )}
            </section>
          )}

          {/* Workspace */}
          {unlocked && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Your submission
              </h2>

              {!submission ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Start the project to open the workspace. Your draft saves as
                    you go.
                  </p>
                  <Button
                    className="mt-5 w-full"
                    onClick={handleStart}
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="animate-spin" /> Starting…
                      </>
                    ) : (
                      "Start this project"
                    )}
                  </Button>
                </>
              ) : (
                <div className="mt-5 space-y-5">
                  <div>
                    <Label htmlFor="analysis">Analysis &amp; solution</Label>
                    <Textarea
                      id="analysis"
                      rows={8}
                      className="mt-2"
                      disabled={locked}
                      value={analysis}
                      onChange={(e) => setAnalysis(e.target.value)}
                      placeholder="Explain your approach, what you found, and the reasoning behind each decision."
                    />
                    <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                      {analysis.trim().length} characters
                      {analysis.trim().length < MIN_ANALYSIS &&
                        ` · ${MIN_ANALYSIS} minimum to submit`}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="recommendations">
                      Results &amp; recommendations
                    </Label>
                    <Textarea
                      id="recommendations"
                      rows={5}
                      className="mt-2"
                      disabled={locked}
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="What should be done with these findings, and in what order?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="repoUrl">
                      Repository or document link{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="repoUrl"
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
                        <CheckCircle2
                          className="h-4 w-4 text-success"
                          aria-hidden="true"
                        />
                        Submitted
                        {submission.submittedAt &&
                          ` on ${new Date(submission.submittedAt).toLocaleDateString("en-IN")}`}
                      </p>
                      <p className="mt-1.5 text-[0.76rem] leading-relaxed text-muted-foreground">
                        Submissions are locked once sent for evaluation.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleSaveDraft}
                        disabled={busy}
                      >
                        Save draft
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={busy}
                      >
                        {busy ? (
                          <>
                            <Loader2 className="animate-spin" /> Submitting…
                          </>
                        ) : (
                          <>
                            <Send /> Submit
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
