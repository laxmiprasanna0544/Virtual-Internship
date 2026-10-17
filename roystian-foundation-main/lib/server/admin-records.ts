import "server-only";

import type { Tx } from "@/lib/server/db";
import type { Tables } from "@/types/db";
import type { AdminData } from "@/lib/records/admin";
import {
  toCertificate,
  toCommunication,
  toLead,
  toPayment,
  toProgress,
  toRegistration,
  toStudent,
  toSubmission,
  type AttemptRow,
} from "@/lib/records/mappers";
import {
  toChallengeEntry,
  toCollege,
  toFellowship,
  toInterviewSession,
  toPassport,
  toProjectSubmission,
  toScholarship,
} from "@/lib/records/career-mappers";

export type { AdminData };

type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T]["Row"];

/** Every row of `table` the caller may see (RLS decides), in primary-key order. */
async function fetchAll<T extends TableName>(
  tx: Tx,
  table: T,
  primaryKey: string[] = ["id"],
): Promise<Row<T>[]> {
  // Table and column names come from the typed list below, never from input.
  const rows = await tx.unsafe(
    `select * from public.${table} order by ${primaryKey.map((c) => `"${c}"`).join(", ")}`,
  );
  return [...rows] as unknown as Row<T>[];
}

export async function fetchAdminData(tx: Tx): Promise<AdminData> {
  const [
    profiles,
    studentRows,
    registrationRows,
    paymentRows,
    progressRows,
    attemptRows,
    submissionRows,
    certificateRows,
    communicationRows,
    leadRows,
    projectRows,
    interviewRows,
    challengeRows,
    passportRows,
    fellowshipRows,
    scholarshipRows,
    collegeRows,
  ] = await Promise.all([
    fetchAll(tx, "profiles"),
    fetchAll(tx, "students"),
    fetchAll(tx, "registrations"),
    fetchAll(tx, "payments"),
    fetchAll(tx, "module_progress", ["student_id", "domain_id"]),
    fetchAll(tx, "assessment_attempts"),
    fetchAll(tx, "submissions"),
    fetchAll(tx, "certificates"),
    fetchAll(tx, "communication_logs"),
    fetchAll(tx, "college_leads"),
    fetchAll(tx, "project_submissions"),
    fetchAll(tx, "interview_sessions"),
    fetchAll(tx, "challenge_entries"),
    fetchAll(tx, "career_passports", ["student_id"]),
    fetchAll(tx, "fellowship_applications"),
    fetchAll(tx, "scholarship_applications"),
    fetchAll(tx, "colleges"),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const students = studentRows.flatMap((row) => {
    const profile = profileById.get(row.id);
    return profile && profile.role === "student" ? [toStudent(profile, row)] : [];
  });
  const studentById = new Map(students.map((s) => [s.id, s]));
  const nameOf = (id: string) => studentById.get(id)?.name ?? "Unknown student";

  const attemptsByStudent = new Map<string, AttemptRow[]>();
  for (const attempt of attemptRows) {
    const list = attemptsByStudent.get(attempt.student_id) ?? [];
    list.push(attempt);
    attemptsByStudent.set(attempt.student_id, list);
  }

  const newestFirst = <T extends { createdAt: string }>(a: T, b: T) =>
    a.createdAt < b.createdAt ? 1 : -1;

  return {
    students: students.sort(newestFirst),
    registrations: registrationRows
      .flatMap((r) => {
        const student = studentById.get(r.student_id);
        return student ? [toRegistration(r, student)] : [];
      })
      .sort(newestFirst),
    payments: paymentRows.map((p) => toPayment(p, nameOf(p.student_id))).sort(newestFirst),
    progress: progressRows.map((p) =>
      toProgress(p.student_id, p.domain_id, p, attemptsByStudent.get(p.student_id) ?? []),
    ),
    submissions: submissionRows.map((s) => toSubmission(s, nameOf(s.student_id))),
    certificates: certificateRows
      .map(toCertificate)
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    communications: communicationRows.map(toCommunication).sort(newestFirst),
    leads: leadRows.map(toLead).sort(newestFirst),
    projectSubmissions: projectRows.map(toProjectSubmission),
    interviews: interviewRows.map(toInterviewSession),
    challengeEntries: challengeRows.map(toChallengeEntry),
    passports: passportRows.map(toPassport),
    fellowshipApplications: fellowshipRows.map(toFellowship),
    scholarshipApplications: scholarshipRows.map(toScholarship).sort(newestFirst),
    colleges: collegeRows.map(toCollege),
  };
}

