"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { AnimatedCounter, AnimatedProgress } from "@/components/motion/animated-counter";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getAssessment, getFinalAssessment } from "@/data/domains";
import { useStudentContext } from "@/lib/use-student";
import { requestCertificate, submitAssessment } from "@/lib/student-data";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AssessmentAttempt } from "@/types";

export function AssessmentRunner({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const ctx = useStudentContext();
  const [answers, setAnswers] = React.useState<Record<string, number[]>>({});
  const [index, setIndex] = React.useState(0);
  const [result, setResult] = React.useState<AssessmentAttempt | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const reduce = useReducedMotion();

  const assessment =
    assessmentId === "final"
      ? ctx.domain
        ? getFinalAssessment(ctx.domain.id)
        : undefined
      : getAssessment(assessmentId);

  const total = assessment?.questions.length ?? 0;
  const activeQuestion = assessment?.questions[index];

  /**
   * Keyboard control: 1–9 picks an option, arrows move between questions.
   * Ignored while the reader is typing or once the assessment is scored.
   */
  React.useEffect(() => {
    if (result || !activeQuestion) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (target &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)))
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((i) => Math.min(total - 1, i + 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
        return;
      }

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= activeQuestion.options.length) {
        event.preventDefault();
        const optionIndex = digit - 1;
        setAnswers((current) => {
          const existing = current[activeQuestion.id] ?? [];
          if (activeQuestion.type === "single") {
            return { ...current, [activeQuestion.id]: [optionIndex] };
          }
          const next = existing.includes(optionIndex)
            ? existing.filter((value) => value !== optionIndex)
            : [...existing, optionIndex];
          return { ...current, [activeQuestion.id]: next };
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result, activeQuestion, total]);

  if (!ctx.ready) return <LoadingState label="Loading assessment" rows={3} />;

  if (!assessment || !ctx.domain || assessment.domainId !== ctx.domain.id) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Assessment not available"
        description="This assessment is not part of your current internship track."
        actionLabel="Back to assessments"
        actionHref="/dashboard/assessments"
      />
    );
  }

  const { student, domain } = ctx;
  const questions = assessment.questions;
  const question = questions[index];
  const answered = Object.keys(answers).filter((key) => answers[key]?.length).length;
  const isFinal = assessment.kind === "final";

  function toggleOption(optionIndex: number) {
    setAnswers((current) => {
      const existing = current[question.id] ?? [];
      if (question.type === "single") {
        return { ...current, [question.id]: [optionIndex] };
      }
      const next = existing.includes(optionIndex)
        ? existing.filter((value) => value !== optionIndex)
        : [...existing, optionIndex];
      return { ...current, [question.id]: next };
    });
  }

  async function handleSubmit() {
    if (!student || !domain || !assessment || submitting) return;
    setSubmitting(true);
    let attempt: AssessmentAttempt;
    try {
      attempt = await submitAssessment(assessment.id, answers);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your answers.");
      return;
    } finally {
      setSubmitting(false);
    }
    setResult(attempt);

    if (attempt.passed) {
      toast.success(`Passed with ${attempt.percentage}%`);
      if (isFinal) {
        // Issue the certificate if every other requirement is already met;
        // the server re-checks and declines otherwise.
        requestCertificate().catch(() => undefined);
      }
    } else {
      toast.error(`Scored ${attempt.percentage}% — 70% needed to pass`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setResult(null);
  }

  /* ── Result view ───────────────────────────────────────────── */
  if (result) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={assessment.title}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Assessments", href: "/dashboard/assessments" },
            { label: "Result" },
          ]}
        />

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={cn(
            "rounded-2xl border p-6 shadow-card sm:p-8",
            result.passed
              ? "border-success/35 bg-success/[0.05]"
              : "border-warning/35 bg-warning/[0.05]",
          )}
          aria-live="polite"
        >
          <motion.span
            initial={reduce ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-full",
              result.passed
                ? "bg-success/12 text-success"
                : "bg-warning/15 text-warning-ink",
            )}
          >
            {result.passed ? (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            ) : (
              <XCircle className="h-6 w-6" aria-hidden="true" />
            )}
            {result.passed && !reduce && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-success/45"
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
                aria-hidden="true"
              />
            )}
          </motion.span>

          <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Assessment complete
          </p>
          <p className="mt-2 font-display text-5xl font-semibold tracking-tight text-foreground">
            <AnimatedCounter value={result.percentage} suffix="%" duration={1.1} />
          </p>
          <h2
            className={cn(
              "mt-2 font-display text-xl font-semibold",
              result.passed ? "text-success" : "text-warning-ink",
            )}
          >
            {result.passed
              ? isFinal
                ? "Final Assessment Passed"
                : "Passed"
              : "Needs Improvement"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You scored {result.score} of {result.total}. The pass mark is{" "}
            {assessment.passingScore}%.
          </p>

          <AnimatedProgress
            value={result.percentage}
            className="mt-5 h-2 max-w-sm"
            barClassName={result.passed ? "bg-success" : "bg-warning"}
            label="Assessment score"
          />

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={restart} variant="outline">
              <RotateCcw /> Retake assessment
            </Button>
            {isFinal && result.passed ? (
              <Button asChild>
                <Link href="/dashboard/certificate">
                  <Award /> Check certificate status
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/assessments">
                  Back to assessments <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </motion.section>

        {/* Review */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Review your answers
          </h3>
          {questions.map((q, qIndex) => {
            const given = [...(result.answers[q.id] ?? [])].sort((a, b) => a - b);
            const expected = [...q.correct].sort((a, b) => a - b);
            const correct =
              given.length === expected.length &&
              given.every((value, i) => value === expected[i]);

            return (
              <article
                key={q.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Question {qIndex + 1}
                  </p>
                  <Badge variant={correct ? "success" : "destructive"}>
                    {correct ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
                <p className="mt-2.5 text-sm font-medium text-foreground">{q.prompt}</p>
                <ul className="mt-3.5 space-y-1.5">
                  {q.options.map((option, optionIndex) => {
                    const isCorrect = q.correct.includes(optionIndex);
                    const wasChosen = given.includes(optionIndex);
                    return (
                      <li
                        key={option}
                        className={cn(
                          "rounded-lg border px-3.5 py-2.5 text-sm",
                          isCorrect
                            ? "border-success/40 bg-success/[0.06] text-foreground"
                            : wasChosen
                              ? "border-destructive/40 bg-destructive/[0.05] text-foreground"
                              : "border-border text-muted-foreground",
                        )}
                      >
                        {option}
                        {isCorrect && (
                          <span className="ml-2 text-xs font-semibold text-success">
                            Correct answer
                          </span>
                        )}
                        {!isCorrect && wasChosen && (
                          <span className="ml-2 text-xs font-semibold text-destructive">
                            Your answer
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  /* ── Question view ─────────────────────────────────────────── */
  const selected = answers[question.id] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        description={assessment.description}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments", href: "/dashboard/assessments" },
          { label: isFinal ? "Final" : `Module ${assessment.moduleId?.slice(-2)}` },
        ]}
      />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Question {index + 1} of {questions.length}
          </p>
          <div className="flex items-center gap-2">
            {isFinal && <Badge variant="warning">Demo Assessment</Badge>}
            <Badge variant="secondary">
              {question.type === "multiple" ? "Select all that apply" : "Single choice"}
            </Badge>
            <Badge variant="outline">Pass mark {assessment.passingScore}%</Badge>
          </div>
        </div>

        <Progress
          value={((index + 1) / questions.length) * 100}
          className="mt-4"
          aria-label="Assessment progress"
        />

        <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset
          key={question.id}
          initial={reduce ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -18 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="mt-7"
        >
          <legend className="text-base font-semibold leading-relaxed text-foreground">
            {question.prompt}
          </legend>

          <ul className="mt-5 space-y-2.5">
            {question.options.map((option, optionIndex) => {
              const active = selected.includes(optionIndex);
              const inputId = `${question.id}-option-${optionIndex}`;
              return (
                <li key={option}>
                  <label
                    htmlFor={inputId}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                      active
                        ? "border-primary bg-primary/[0.06] shadow-soft"
                        : "border-border bg-background hover:border-primary/35 hover:bg-muted/40",
                    )}
                  >
                    {question.type === "multiple" ? (
                      <Checkbox
                        id={inputId}
                        checked={active}
                        onCheckedChange={() => toggleOption(optionIndex)}
                        className="mt-0.5"
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="radio"
                        name={question.id}
                        checked={active}
                        onChange={() => toggleOption(optionIndex)}
                        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                    )}
                    <span className="flex-1 text-sm leading-relaxed text-foreground">
                      {option}
                    </span>
                    <span
                      className="hidden shrink-0 rounded border border-border px-1.5 font-mono text-[0.62rem] text-muted-foreground sm:block"
                      aria-hidden="true"
                    >
                      {optionIndex + 1}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </motion.fieldset>
        </AnimatePresence>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {answered} of {questions.length} answered
            </p>
            <p className="mt-1 hidden text-[0.68rem] text-muted-foreground/80 sm:block">
              Press 1–{question.options.length} to answer, ← → to move between questions.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ArrowLeft /> Previous
            </Button>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next <ArrowRight />
              </Button>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button disabled={submitting}>
                    <CheckCircle2 /> {submitting ? "Submitting…" : "Submit Assessment"}
                  </Button>
                }
                title="Submit this assessment?"
                description={
                  answered < questions.length
                    ? `You have answered ${answered} of ${questions.length} questions. Unanswered questions are marked incorrect.`
                    : "Your answers will be scored immediately. You can retake the assessment afterwards."
                }
                confirmLabel="Submit"
                onConfirm={handleSubmit}
              />
            )}
          </div>
        </div>
      </section>

      {/* Question navigator */}
      <nav aria-label="Question navigator">
        <ul className="flex flex-wrap gap-2">
          {questions.map((q, qIndex) => {
            const done = (answers[q.id] ?? []).length > 0;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setIndex(qIndex)}
                  aria-label={`Go to question ${qIndex + 1}${done ? ", answered" : ""}`}
                  aria-current={qIndex === index ? "true" : undefined}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-xs transition-colors",
                    qIndex === index
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-border bg-card text-muted-foreground hover:border-primary/35",
                  )}
                >
                  {qIndex + 1}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Button variant="ghost" onClick={() => router.push("/dashboard/assessments")}>
        <ArrowLeft /> Leave assessment
      </Button>
    </div>
  );
}
