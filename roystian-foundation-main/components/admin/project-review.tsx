"use client";

import * as React from "react";
import { CheckCircle2, FolderKanban, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProject } from "@/data/projects";
import { evaluateProject, useAdminData } from "@/lib/admin-data";
import { clamp, formatDate } from "@/lib/utils";
import type { ProjectSubmission } from "@/types";

/**
 * Trainer / admin evaluation of project submissions.
 *
 * Scores are entered per published criterion and combined using the brief's
 * own weights, so a student's mark reflects exactly the rubric they were shown
 * before they started.
 */
export function ProjectReview() {
  const db = useAdminData();
  const [active, setActive] = React.useState<ProjectSubmission | null>(null);
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!db) return <LoadingState label="Loading submissions" rows={4} />;

  const pending = db.projectSubmissions
    .filter((p) => p.status === "submitted")
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  const evaluated = db.projectSubmissions.filter((p) => p.status === "evaluated");

  function open(submission: ProjectSubmission) {
    const brief = getProject(submission.projectId);
    const initial: Record<string, string> = {};
    for (const criterion of brief?.evaluationCriteria ?? []) {
      initial[criterion.label] = String(
        submission.criterionScores?.[criterion.label] ?? "",
      );
    }
    setScores(initial);
    setFeedback(submission.feedback ?? "");
    setActive(submission);
  }

  async function handleEvaluate() {
    if (!active) return;
    const brief = getProject(active.projectId);
    if (!brief) return;

    const parsed: Record<string, number> = {};
    for (const criterion of brief.evaluationCriteria) {
      const raw = Number(scores[criterion.label]);
      if (!Number.isFinite(raw)) {
        toast.error("Missing score", {
          description: `Enter a score for "${criterion.label}".`,
        });
        return;
      }
      parsed[criterion.label] = clamp(Math.round(raw), 0, 100);
    }

    setBusy(true);
    try {
      const { overallScore } = await evaluateProject(active.id, parsed, feedback);
      setActive(null);
      toast.success(`Evaluation saved — ${overallScore}/100`, {
        description: "The student's readiness score updates immediately.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------- Detail ---------------------------- */
  if (active) {
    const brief = getProject(active.projectId);
    const student = db.students.find((s) => s.id === active.studentId);

    return (
      <div>
        <PageHeader
          title={brief?.title ?? "Project submission"}
          description={`${student?.name ?? "Unknown student"} · submitted ${active.submittedAt ? formatDate(active.submittedAt) : "—"}`}
          action={
            <Button variant="outline" onClick={() => setActive(null)}>
              Back to queue
            </Button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Analysis &amp; solution
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {active.analysis || "No analysis submitted."}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Results &amp; recommendations
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {active.recommendations || "No recommendations submitted."}
              </p>
            </section>

            {active.repoUrl && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-[0.95rem] font-semibold text-foreground">
                  Linked work
                </h2>
                <p className="mt-2 break-all font-mono text-[0.8rem] text-primary">
                  {active.repoUrl}
                </p>
              </section>
            )}
          </div>

          {/* ── Scoring ───────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Score against the published criteria
            </h2>

            <div className="mt-5 space-y-4">
              {brief?.evaluationCriteria.map((criterion) => (
                <div key={criterion.label}>
                  <Label htmlFor={criterion.label}>
                    {criterion.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({criterion.weight}% weight)
                    </span>
                  </Label>
                  <p className="mt-1 text-[0.76rem] leading-relaxed text-muted-foreground">
                    {criterion.detail}
                  </p>
                  <Input
                    id={criterion.label}
                    type="number"
                    min={0}
                    max={100}
                    className="mt-2"
                    value={scores[criterion.label] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [criterion.label]: e.target.value,
                      }))
                    }
                    placeholder="0–100"
                  />
                </div>
              ))}

              <div>
                <Label htmlFor="project-feedback">Feedback to the student</Label>
                <Textarea
                  id="project-feedback"
                  rows={5}
                  className="mt-2"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What was strong, and the one thing that would most improve the next submission."
                />
              </div>

              <Button className="w-full" onClick={handleEvaluate} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save /> Save evaluation
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ---------------------------- Queue ----------------------------- */
  return (
    <div>
      <PageHeader
        title="Project Submissions"
        description="Evaluate submitted projects against the criteria published in each brief. Scores feed directly into student readiness and badges."
      />

      {pending.length === 0 && evaluated.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No submissions yet"
          description="Project submissions appear here as students send them for evaluation."
        />
      ) : (
        <>
          <section>
            <h2 className="eyebrow mb-4">
              Awaiting evaluation ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center text-sm text-muted-foreground">
                Nothing in the queue.
              </p>
            ) : (
              <div className="space-y-3">
                {pending.map((submission) => {
                  const brief = getProject(submission.projectId);
                  const student = db.students.find(
                    (s) => s.id === submission.studentId,
                  );
                  return (
                    <div
                      key={submission.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="text-[0.9rem] font-semibold text-foreground">
                          {brief?.title ?? submission.projectId}
                        </p>
                        <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                          {student?.name ?? "Unknown"} ·{" "}
                          {submission.submittedAt
                            ? formatDate(submission.submittedAt)
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Submitted</Badge>
                        <Button size="sm" onClick={() => open(submission)}>
                          Evaluate
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {evaluated.length > 0 && (
            <section className="mt-10">
              <h2 className="eyebrow mb-4">Evaluated ({evaluated.length})</h2>
              <div className="space-y-2.5">
                {evaluated.map((submission) => {
                  const brief = getProject(submission.projectId);
                  const student = db.students.find(
                    (s) => s.id === submission.studentId,
                  );
                  return (
                    <div
                      key={submission.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-3.5 shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="text-[0.88rem] font-medium text-foreground">
                          {brief?.title ?? submission.projectId}
                        </p>
                        <p className="mt-0.5 text-[0.76rem] text-muted-foreground">
                          {student?.name ?? "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-mono text-[0.85rem] font-semibold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {submission.overallScore}%
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => open(submission)}
                        >
                          Revise
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
