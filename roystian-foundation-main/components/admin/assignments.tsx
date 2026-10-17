"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, FileText, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/admin/filters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reviewSubmission, useAdminData } from "@/lib/admin-data";
import { SubmissionFileLink } from "@/components/admin/submission-file-link";
import { DOMAINS, getDomain } from "@/data/domains";
import { formatDateTime } from "@/lib/utils";
import type { Submission } from "@/types";

export function AdminAssignments() {
  const db = useAdminData();
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [active, setActive] = React.useState<Submission | null>(null);
  const [feedback, setFeedback] = React.useState("");
  const [reviewing, setReviewing] = React.useState(false);

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.submissions]
      .sort((a, b) => ((a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1))
      .filter((submission) => {
        if (domainFilter !== "all" && submission.domainId !== domainFilter) return false;
        if (statusFilter !== "all" && submission.status !== statusFilter) return false;
        if (!q) return true;
        return (
          submission.studentName.toLowerCase().includes(q) ||
          submission.taskTitle.toLowerCase().includes(q)
        );
      });
  }, [db, query, domainFilter, statusFilter]);

  if (!db) return <LoadingState label="Loading submissions" rows={4} />;

  function openReview(submission: Submission) {
    setActive(submission);
    setFeedback(submission.feedback ?? "");
  }

  async function submitReview(status: "approved" | "needs-revision") {
    if (!active || reviewing) return;
    setReviewing(true);
    try {
      await reviewSubmission(
        active.id,
        status,
        feedback.trim() ||
          (status === "approved"
            ? "Approved. Requirements addressed correctly."
            : "Please expand your response against each requirement and resubmit."),
      );
      toast.success(status === "approved" ? "Submission approved" : "Marked as needs revision");
      setActive(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the review.");
    } finally {
      setReviewing(false);
    }
  }

  const counts = {
    pending: db.submissions.filter((s) => s.status === "pending").length,
    submitted: db.submissions.filter((s) => s.status === "submitted").length,
    approved: db.submissions.filter((s) => s.status === "approved").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assignments"
        description="Practical task submissions awaiting review, with approve and needs-revision outcomes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting submission" value={counts.pending} icon={FileText} />
        <StatCard label="Awaiting review" value={counts.submitted} icon={MessageSquareWarning} />
        <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} />
      </div>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by student or task"
        onReset={() => {
          setQuery("");
          setDomainFilter("all");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "sub-domain",
            label: "Domains",
            value: domainFilter,
            onChange: setDomainFilter,
            options: DOMAINS.map((d) => ({ value: d.id, label: d.shortName })),
          },
          {
            id: "sub-status",
            label: "Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "pending", label: "Pending" },
              { value: "submitted", label: "Submitted" },
              { value: "reviewed", label: "Reviewed" },
              { value: "approved", label: "Approved" },
              { value: "needs-revision", label: "Needs revision" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No submissions match those filters"
          description="Try clearing the search or selecting a different status."
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((submission) => (
            <li
              key={submission.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/students/${submission.studentId}`}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {submission.studentName}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {getDomain(submission.domainId)?.name ?? "—"}
                  </p>
                </div>
                <StatusBadge status={submission.status} />
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                {submission.taskTitle}
              </p>
              <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {submission.responseText || "No written response submitted yet."}
              </p>

              {submission.fileName && (
                <div className="mt-2.5">
                  <SubmissionFileLink id={submission.id} filePath={submission.filePath} fileName={submission.fileName} />
                </div>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                Submitted {formatDateTime(submission.submittedAt)}
              </p>

              <div className="mt-4 flex gap-2.5 border-t border-border pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={submission.status === "pending"}
                  onClick={() => openReview(submission)}
                >
                  Review
                </Button>
                <Button asChild size="sm" variant="ghost" className="flex-1">
                  <Link href={`/admin/students/${submission.studentId}`}>Open student</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
            <DialogDescription>
              {active?.studentName} — {active?.taskTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed text-muted-foreground">
            {active?.responseText || "No written response submitted."}
          </div>
          {active?.fileName && (
            <SubmissionFileLink id={active.id} filePath={active.filePath} fileName={active.fileName} />
          )}

          <div>
            <label htmlFor="review-feedback" className="mb-2 block text-sm font-medium">
              Feedback
            </label>
            <Textarea
              id="review-feedback"
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Explain what was good and what needs work."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              disabled={reviewing}
              onClick={() => submitReview("needs-revision")}
            >
              Needs revision
            </Button>
            <Button disabled={reviewing} onClick={() => submitReview("approved")}>
              <CheckCircle2 /> Approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
