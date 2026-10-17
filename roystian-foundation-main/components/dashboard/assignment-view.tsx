"use client";

import * as React from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentContext } from "@/lib/use-student";
import { submitPracticalTask } from "@/lib/student-data";
import {
  ALLOWED_SUBMISSION_EXTENSIONS,
  MAX_SUBMISSION_FILE_BYTES,
  MIN_SUBMISSION_TEXT_LENGTH,
  validateSubmission,
} from "@/lib/submission-validation";
import { formatDateTime } from "@/lib/utils";

// Set NEXT_PUBLIC_UPLOADS_ENABLED=false at build time on deployments without object storage.
const UPLOADS_ENABLED = process.env.NEXT_PUBLIC_UPLOADS_ENABLED !== "false";

export function AssignmentView() {
  const ctx = useStudentContext();
  const [text, setText] = React.useState("");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileSize, setFileSize] = React.useState<number | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ctx.ready && !hydrated) {
      setText(ctx.submission?.responseText ?? "");
      setFileName(ctx.submission?.fileName ?? null);
      setHydrated(true);
    }
  }, [ctx.ready, ctx.submission, hydrated]);

  if (!ctx.ready) return <LoadingState label="Loading practical task" rows={3} />;

  if (!ctx.domain || !ctx.student) {
    return (
      <EmptyState
        icon={FileText}
        title="No practical task yet"
        description="Choose a domain to see the practical activity for your internship."
        actionLabel="Choose a domain"
        actionHref="/start/domain"
      />
    );
  }

  const { domain, student, submission } = ctx;
  const task = domain.practicalTask;
  const status = submission?.status ?? "pending";
  const locked = status === "approved";

  function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    const ext = chosen.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_SUBMISSION_EXTENSIONS.includes(ext)) {
      toast.error(
        `"${ext || "unknown"}" files aren't accepted. Upload one of: ${ALLOWED_SUBMISSION_EXTENSIONS.join(", ")}.`,
      );
      event.target.value = "";
      return;
    }
    if (chosen.size > MAX_SUBMISSION_FILE_BYTES) {
      toast.error("File is larger than the 20MB limit.");
      event.target.value = "";
      return;
    }
    setFile(chosen);
    setFileName(chosen.name);
    setFileSize(chosen.size);
    toast.success("File attached", {
      description: "It uploads when you submit.",
    });
    event.target.value = "";
  }

  async function handleSubmit() {
    if (!student) return;

    const clientCheck = validateSubmission({ responseText: text, fileName, fileSize }, task);
    if (!clientCheck.valid) {
      toast.error(clientCheck.reason ?? "Please review your submission.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: domain.id,
          responseText: text.trim(),
          fileName,
          fileSize,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.valid) {
        toast.error(result.reason ?? "Submission could not be validated. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      toast.error("Could not validate your submission. Check your connection and try again.");
      setSubmitting(false);
      return;
    }

    try {
      await submitPracticalTask({
        domainId: domain.id,
        taskTitle: task.title,
        responseText: text.trim(),
        file,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your work.");
      setSubmitting(false);
      return;
    }
    setFile(null);
    setSubmitting(false);
    toast.success("Practical task submitted", {
      description: "It now moves to the review queue.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practical Task"
        description={`The applied activity for your ${domain.name} internship. Submitting it is one of the certificate requirements.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assignments" },
        ]}
        action={<StatusBadge status={status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* Task brief */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Task description
              </h2>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              {task.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {task.brief}
            </p>

            <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Requirements
            </h4>
            <ol className="mt-3 space-y-2.5">
              {task.requirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground">{requirement}</span>
                </li>
              ))}
            </ol>

            <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Deliverable
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">{task.deliverable}</p>
          </section>

          {/* Submission */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your submission
            </h2>

            {locked ? (
              <div className="mt-4 rounded-xl border border-success/30 bg-success/[0.05] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Approved
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {submission?.feedback ?? "Your submission has been approved."}
                </p>
              </div>
            ) : (
              <Tabs defaultValue="text" className="mt-4">
                <TabsList>
                  <TabsTrigger value="text">Text response</TabsTrigger>
                  <TabsTrigger value="file">Upload file</TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <label htmlFor="submission-text" className="sr-only">
                    Written response
                  </label>
                  <Textarea
                    id="submission-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={12}
                    placeholder="Write your response here. Cover each requirement in order."
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {text.trim().length} characters ·{" "}
                    {fileName
                      ? "your notes must relate to the requirements above"
                      : `at least ${MIN_SUBMISSION_TEXT_LENGTH} characters required, addressing the requirements above`}
                  </p>
                </TabsContent>

                <TabsContent value="file">
                  {!UPLOADS_ENABLED ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        File attachments aren&apos;t available yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submit your work as text in the Response tab. Your reviewer assesses the
                        written response in the same way.
                      </p>
                    </div>
                  ) : (
                  <>
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <Upload
                      className="mx-auto h-6 w-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Attach your deliverable
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, notebook, spreadsheet, image or archive, up to 20MB. Files
                      are stored privately and shared only with your reviewers.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept={ALLOWED_SUBMISSION_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
                      onChange={handleFileChosen}
                      aria-label="Choose a file to attach"
                    />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                    >
                      <Paperclip /> Choose file
                    </Button>
                  </div>

                  {fileName && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5">
                      <FileText
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setFileName(null);
                          setFileSize(null);
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Remove attached file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  </>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {!locked && (
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  You can resubmit until your work is approved.
                </p>
                <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send /> {status === "pending" ? "Submit task" : "Resubmit task"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Submission status
            </h2>
            <div className="mt-4 space-y-3.5">
              {[
                { label: "Status", value: <StatusBadge status={status} /> },
                {
                  label: "Submitted",
                  value: (
                    <span className="text-sm text-foreground">
                      {formatDateTime(submission?.submittedAt)}
                    </span>
                  ),
                },
                {
                  label: "Reviewed",
                  value: (
                    <span className="text-sm text-foreground">
                      {formatDateTime(submission?.reviewedAt)}
                    </span>
                  ),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3.5 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  {row.value}
                </div>
              ))}
            </div>

            {submission?.feedback && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Reviewer feedback
                </p>
                <p className="mt-1.5 text-sm text-foreground">{submission.feedback}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Evaluated on
            </h2>
            <ul className="mt-4 space-y-2.5">
              {task.evaluation.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
              Statuses move Pending → Submitted → Reviewed, and a reviewer can mark the
              work Approved or Needs Revision.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
