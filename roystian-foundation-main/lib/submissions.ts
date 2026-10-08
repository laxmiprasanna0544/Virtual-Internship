"use client";

import { getDomain } from "@/data/domains";
import { getDB, updateDB } from "@/lib/db";
import { logCommunication } from "@/lib/communications";
import { pushNotification } from "@/lib/notifications";
import type { Student, Submission, SubmissionStatus } from "@/types";

export function listSubmissions(): Submission[] {
  return [...getDB().submissions].sort((a, b) =>
    (a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1,
  );
}

export function submitAssignment(
  student: Student,
  input: { responseText: string; fileName: string | null },
): Submission {
  const domain = getDomain(student.domainId);
  const domainId = student.domainId ?? "";
  const now = new Date().toISOString();
  const submission: Submission = {
    id: `sub_${student.id}_${domainId}`,
    studentId: student.id,
    studentName: student.name,
    domainId,
    taskTitle: domain?.practicalTask.title ?? "Practical Task",
    responseText: input.responseText,
    fileName: input.fileName,
    status: "submitted",
    feedback: null,
    submittedAt: now,
    reviewedAt: null,
  };

  updateDB((db) => {
    db.submissions = [
      submission,
      ...db.submissions.filter(
        (s) => !(s.studentId === student.id && s.domainId === domainId),
      ),
    ];
  });

  pushNotification(
    student.id,
    "assignment",
    "Practical task submitted",
    "Your submission has been recorded and is awaiting review.",
    "/dashboard/assignments",
  );

  logCommunication(
    "assignment-reviewed",
    "internal",
    "Programme team",
    "Practical task submitted",
    `${student.name} submitted the practical activity for ${domain?.name ?? "their domain"}.`,
  );

  return submission;
}

export function reviewSubmission(
  submissionId: string,
  status: Extract<SubmissionStatus, "approved" | "needs-revision" | "reviewed">,
  feedback: string,
): void {
  let studentId: string | null = null;
  updateDB((db) => {
    db.submissions = db.submissions.map((s) => {
      if (s.id !== submissionId) return s;
      studentId = s.studentId;
      return {
        ...s,
        status,
        feedback,
        reviewedAt: new Date().toISOString(),
      };
    });
  });

  if (studentId) {
    pushNotification(
      studentId,
      "assignment",
      status === "approved"
        ? "Practical task approved"
        : status === "needs-revision"
          ? "Practical task needs revision"
          : "Practical task reviewed",
      feedback || "Your submission has been reviewed.",
      "/dashboard/assignments",
    );
  }
}
