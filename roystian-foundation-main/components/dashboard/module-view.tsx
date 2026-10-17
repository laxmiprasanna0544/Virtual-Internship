"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  NotebookPen,
  RotateCcw,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { LearningGuideCard } from "@/components/dashboard/learning-guide-card";
import { ReadingPane } from "@/components/dashboard/reading-pane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getModule } from "@/data/domains";
import { useStudentContext } from "@/lib/use-student";
import { saveModuleNote, setModuleComplete } from "@/lib/student-data";

export function ModuleView({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const ctx = useStudentContext();
  const lesson = getModule(moduleId);
  const [note, setNote] = React.useState("");
  const [noteLoaded, setNoteLoaded] = React.useState(false);

  React.useEffect(() => {
    if (ctx.ready && !noteLoaded) {
      setNote(ctx.progress?.notes?.[moduleId] ?? "");
      setNoteLoaded(true);
    }
  }, [ctx.ready, ctx.progress, moduleId, noteLoaded]);

  if (!ctx.ready) return <LoadingState label="Loading module" rows={3} />;

  if (!lesson || !ctx.domain || lesson.domainId !== ctx.domain.id) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Module not found"
        description="This module is not part of your current internship track."
        actionLabel="Back to learning"
        actionHref="/dashboard/learning"
      />
    );
  }

  const { student, domain, progress } = ctx;
  const completed = (progress?.completedModules ?? []).includes(lesson.id);
  const attempt = progress?.moduleAttempts?.[lesson.assessmentId];
  const index = domain.modules.findIndex((m) => m.id === lesson.id);
  const previous = index > 0 ? domain.modules[index - 1] : null;
  const next = index < domain.modules.length - 1 ? domain.modules[index + 1] : null;

  async function toggleComplete() {
    if (!student || !domain) return;
    try {
      await setModuleComplete(domain.id, lesson!.id, !completed);
      if (completed) {
        toast("Module marked incomplete");
      } else {
        toast.success("Module marked complete", {
          description: next ? `Next up: ${next.title}` : "That was the last lesson.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update progress.");
    }
  }

  async function handleNoteBlur() {
    if (!student || !domain) return;
    if (note === (progress?.notes?.[lesson!.id] ?? "")) return;
    try {
      await saveModuleNote(domain.id, lesson!.id, note);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save your note.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lesson.title}
        description={lesson.summary}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning", href: "/dashboard/learning" },
          { label: `Module ${String(lesson.number).padStart(2, "0")}` },
        ]}
        action={
          <Button variant={completed ? "outline" : "default"} onClick={toggleComplete}>
            {completed ? (
              <>
                <RotateCcw /> Mark incomplete
              </>
            ) : (
              <>
                <CheckCircle2 /> Mark Module Complete
              </>
            )}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <ReadingPane
            moduleNumber={lesson.number}
            title={lesson.title}
            summary={lesson.summary}
            readMinutes={lesson.readMinutes}
            sections={lesson.reading}
            completed={completed}
          />

          {/* Learning objectives */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Learning objectives
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {lesson.objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-3 text-sm">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    {objective}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <NotebookPen className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Your notes
              </h2>
            </div>
            <label htmlFor="module-note" className="sr-only">
              Notes for {lesson.title}
            </label>
            <Textarea
              id="module-note"
              className="mt-4"
              value={note}
              placeholder="Write anything you want to remember from this module…"
              onChange={(event) => setNote(event.target.value)}
              onBlur={handleNoteBlur}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Notes are saved automatically when you click away.
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          {/* Assessment */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Module assessment
              </h2>
            </div>
            {attempt ? (
              <div className="mt-4">
                <Badge variant={attempt.passed ? "success" : "warning"}>
                  {attempt.passed ? "Passed" : "Needs Improvement"} · {attempt.percentage}%
                </Badge>
                <p className="mt-2.5 text-sm text-muted-foreground">
                  You scored {attempt.score} of {attempt.total}. You can retake it to
                  improve your score.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                A short assessment covering this module's key concepts. You need 70% to
                pass, with up to five attempts a day.
              </p>
            )}
            <Button asChild className="mt-4 w-full">
              <Link href={`/dashboard/assessments/${lesson.assessmentId}`}>
                {attempt ? "Retake assessment" : "Take assessment"} <ArrowRight />
              </Link>
            </Button>
          </section>

          {/* The domain's learning guide */}
          {ctx.domain && <LearningGuideCard domain={ctx.domain} />}

          {/* Key concepts */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Key concepts
            </h2>
            <dl className="mt-4 space-y-3">
              {lesson.concepts.map((concept) => (
                <div key={concept.term}>
                  <dt className="text-sm font-semibold text-foreground">
                    {concept.term}
                  </dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {concept.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>

      {/* Module navigation */}
      <nav
        className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Module navigation"
      >
        {previous ? (
          <Button variant="outline" onClick={() => router.push(`/dashboard/learning/${previous.id}`)}>
            <ArrowLeft /> Module {String(previous.number).padStart(2, "0")}
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button onClick={() => router.push(`/dashboard/learning/${next.id}`)}>
            Module {String(next.number).padStart(2, "0")} <ArrowRight />
          </Button>
        ) : (
          <Button asChild>
            <Link href="/dashboard/assessments/final">
              Go to final assessment <ArrowRight />
            </Link>
          </Button>
        )}
      </nav>
    </div>
  );
}
