"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Ban,
  CheckCircle2,
  Mail,
  MessageCircle,
  Minus,
  PlayCircle,
  Plus,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatabase, updateDB } from "@/lib/db";
import { getDomain, getDomainAssessments, getFinalAssessment } from "@/data/domains";
import { getProgram } from "@/data/programs";
import {
  completionRequirements,
  ensureProgress,
  markModuleComplete,
  markModuleIncomplete,
  summariseProgress,
  updateProgress,
} from "@/lib/progress";
import { generateCertificate } from "@/lib/certificates";
import { reviewSubmission } from "@/lib/submissions";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

export function AdminStudentDetail({ studentId }: { studentId: string }) {
  const db = useDatabase();

  if (!db) return <LoadingState label="Loading student" rows={3} />;

  const student = db.students.find((s) => s.id === studentId);
  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="This student record does not exist in the demo dataset."
        actionLabel="Back to students"
        actionHref="/admin/students"
      />
    );
  }

  const domain = getDomain(student.domainId);
  const program = getProgram(student.programId);
  const registration = db.registrations.find((r) => r.studentId === student.id) ?? null;
  const payment = db.payments.find((p) => p.studentId === student.id) ?? null;
  const progress =
    db.progress.find(
      (p) => p.studentId === student.id && p.domainId === student.domainId,
    ) ?? null;
  const submission = db.submissions.find((s) => s.studentId === student.id) ?? null;
  const certificate = db.certificates.find((c) => c.studentId === student.id) ?? null;
  const summary = summariseProgress(student, progress, submission);
  const requirements = completionRequirements(student, progress, submission);
  const communications = db.communications.filter(
    (c) => c.recipient === student.email || c.recipient === student.mobile,
  );
  const moduleAssessments = domain ? getDomainAssessments(domain.id) : [];

  function toggleModule(moduleId: string, done: boolean) {
    if (!student?.domainId) return;
    if (done) {
      markModuleIncomplete(student.id, student.domainId, moduleId);
    } else {
      markModuleComplete(student.id, student.domainId, moduleId);
    }
  }

  function setAllModules(complete: boolean) {
    if (!student?.domainId || !domain) return;
    ensureProgress(student.id, student.domainId);
    updateProgress(student.id, student.domainId, (p) => {
      p.completedModules = complete ? domain.modules.map((m) => m.id) : [];
      if (complete) {
        for (const assessment of moduleAssessments) {
          p.moduleAttempts[assessment.id] = {
            assessmentId: assessment.id,
            score: assessment.questions.length,
            total: assessment.questions.length,
            percentage: 100,
            passed: true,
            answers: {},
            submittedAt: new Date().toISOString(),
          };
        }
      } else {
        p.moduleAttempts = {};
      }
    });
    toast.success(
      complete ? "All modules and assessments marked complete" : "Module progress reset",
    );
  }

  function toggleFinal() {
    if (!student?.domainId || !domain) return;
    const finalAssessment = getFinalAssessment(domain.id);
    if (!finalAssessment) return;
    ensureProgress(student.id, student.domainId);
    updateProgress(student.id, student.domainId, (p) => {
      p.finalAttempt = p.finalAttempt?.passed
        ? null
        : {
            assessmentId: finalAssessment.id,
            score: 9,
            total: 10,
            percentage: 90,
            passed: true,
            answers: {},
            submittedAt: new Date().toISOString(),
          };
    });
    toast.success("Final assessment status updated");
  }

  function issueCertificate() {
    if (!student) return;
    const issued = generateCertificate(student);
    if (issued) {
      toast.success(`Certificate ${issued.id} issued`);
    } else {
      toast.error("Completion requirements are not satisfied yet");
    }
  }

  function toggleSuspend() {
    if (!student) return;
    const next = student.status === "suspended" ? "active" : "suspended";
    updateDB((draft) => {
      draft.students = draft.students.map((s) =>
        s.id === student.id ? { ...s, status: next } : s,
      );
    });
    toast.success(next === "suspended" ? "Student suspended" : "Student reactivated");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`${domain?.name ?? "No domain"} · ${program?.name ?? "No programme"}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Students", href: "/admin/students" },
          { label: student.name },
        ]}
        action={
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                {student.status === "suspended" ? <PlayCircle /> : <Ban />}
                {student.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            }
            title={
              student.status === "suspended"
                ? "Reactivate this student?"
                : "Suspend this student?"
            }
            description={
              student.status === "suspended"
                ? "They will regain access to their dashboard."
                : "They will be blocked from signing in until reactivated."
            }
            confirmLabel={student.status === "suspended" ? "Reactivate" : "Suspend"}
            destructive={student.status !== "suspended"}
            onConfirm={toggleSuspend}
          />
        }
      />

      {/* Summary */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={student.status} />
          {registration && <StatusBadge status={registration.internshipStatus} />}
          {certificate && <Badge variant="success">Certificate {certificate.id}</Badge>}
        </div>
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-foreground">
              {summary.overallPercent}% complete
            </span>
            <span className="text-xs text-muted-foreground">
              {summary.modulesCompleted}/{summary.moduleTotal} modules ·{" "}
              {summary.assessmentsPassed}/{summary.assessmentTotal} assessments
            </span>
          </div>
          <Progress value={summary.overallPercent} className="mt-2.5" />
        </div>
      </section>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="comms">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <DetailGrid
            rows={[
              { label: "Full name", value: student.name },
              { label: "Email", value: student.email },
              { label: "Mobile", value: student.mobile || "—" },
              { label: "City", value: student.city || "—" },
              { label: "College", value: student.college || "—" },
              { label: "Course", value: student.course || "—" },
              { label: "Education level", value: student.educationLevel },
              { label: "Joined", value: formatDate(student.createdAt) },
            ]}
          />
        </TabsContent>

        <TabsContent value="enrollment">
          <DetailGrid
            rows={[
              { label: "Registration ID", value: student.registrationId ?? "—" },
              { label: "Domain", value: domain?.name ?? "—" },
              { label: "Program", value: program?.name ?? "—" },
              { label: "Experience", value: student.experience ?? "—" },
              { label: "Start date", value: formatDate(registration?.startDate) },
              {
                label: "Amount",
                value: registration ? formatINR(registration.amount) : "—",
              },
              { label: "Payment ID", value: payment?.id ?? "—" },
              { label: "Payment status", value: payment?.status ?? "—" },
            ]}
          />
        </TabsContent>

        <TabsContent value="progress">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              <Button size="sm" onClick={() => setAllModules(true)}>
                <CheckCircle2 /> Mark all modules complete
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAllModules(false)}>
                <RotateCcw /> Reset module progress
              </Button>
              <Button size="sm" variant="outline" onClick={toggleFinal}>
                <Award /> Toggle final assessment pass
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Changes here are reflected immediately on the student's dashboard.
            </p>

            {domain ? (
              <ul className="space-y-2">
                {domain.modules.map((m) => {
                  const done = (progress?.completedModules ?? []).includes(m.id);
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          <span className="mr-2 font-mono text-xs text-primary">
                            {String(m.number).padStart(2, "0")}
                          </span>
                          {m.title}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={done ? "outline" : "secondary"}
                        onClick={() => toggleModule(m.id, done)}
                      >
                        {done ? <Minus /> : <Plus />}
                        {done ? "Mark incomplete" : "Mark complete"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="No domain selected"
                description="This student has not chosen a domain yet."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          {moduleAssessments.length === 0 ? (
            <EmptyState
              title="No assessments"
              description="Assessments appear once the student selects a domain."
            />
          ) : (
            <ul className="space-y-2">
              {moduleAssessments.map((assessment) => {
                const attempt = progress?.moduleAttempts?.[assessment.id];
                return (
                  <li
                    key={assessment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <p className="min-w-0 truncate text-sm text-foreground">
                      {assessment.title}
                    </p>
                    {attempt ? (
                      <Badge variant={attempt.passed ? "success" : "warning"}>
                        {attempt.percentage}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not attempted</Badge>
                    )}
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/[0.04] px-4 py-3">
                <p className="text-sm font-medium text-foreground">Final assessment</p>
                {progress?.finalAttempt ? (
                  <Badge variant={progress.finalAttempt.passed ? "success" : "warning"}>
                    {progress.finalAttempt.percentage}%
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not attempted</Badge>
                )}
              </li>
            </ul>
          )}
        </TabsContent>

        <TabsContent value="assignment">
          {submission ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {submission.taskTitle}
                  </h3>
                  <StatusBadge status={submission.status} />
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {submission.responseText || "No written response submitted."}
                </p>
                {submission.fileName && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Attached file: <span className="font-mono">{submission.fileName}</span>
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Submitted {formatDateTime(submission.submittedAt)} · Reviewed{" "}
                  {formatDateTime(submission.reviewedAt)}
                </p>
                {submission.feedback && (
                  <p className="mt-3 rounded-lg bg-muted/50 px-3.5 py-2.5 text-sm text-foreground">
                    {submission.feedback}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Button
                  size="sm"
                  onClick={() => {
                    reviewSubmission(
                      submission.id,
                      "approved",
                      "Clear structure and correct use of terminology. Approved.",
                    );
                    toast.success("Submission approved");
                  }}
                >
                  <CheckCircle2 /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reviewSubmission(
                      submission.id,
                      "needs-revision",
                      "Add more detail against each requirement and resubmit.",
                    );
                    toast("Marked as needs revision");
                  }}
                >
                  Needs revision
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No submission yet"
              description="The student has not submitted the practical task."
            />
          )}
        </TabsContent>

        <TabsContent value="certificate">
          <div className="space-y-4">
            <ul className="space-y-2">
              {requirements.map((requirement) => (
                <li
                  key={requirement.key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {requirement.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {requirement.detail}
                    </p>
                  </div>
                  <Badge variant={requirement.done ? "success" : "secondary"}>
                    {requirement.done ? "Done" : "Pending"}
                  </Badge>
                </li>
              ))}
            </ul>

            {certificate ? (
              <div className="rounded-2xl border border-success/30 bg-success/[0.05] p-5">
                <p className="text-sm font-semibold text-foreground">
                  Certificate {certificate.id}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Issued {formatDate(certificate.issueDate)} · Status{" "}
                  {certificate.status}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/verify/${certificate.id}`}>Open verification page</Link>
                </Button>
              </div>
            ) : (
              <Button onClick={issueCertificate}>
                <Award /> Issue certificate if eligible
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comms">
          {communications.length === 0 ? (
            <EmptyState
              title="No communications yet"
              description="Automated messages appear here once they are triggered."
            />
          ) : (
            <ul className="space-y-2">
              {communications.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {entry.channel === "whatsapp" ? (
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {entry.subject}
                    </p>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{entry.body}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)} · {entry.channel}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="border-b border-border pb-3.5">
          <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {row.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium capitalize text-foreground">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
