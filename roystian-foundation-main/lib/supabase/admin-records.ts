import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database as SupabaseSchema } from "@/types/supabase";
import type { Database as DemoDatabase } from "@/data/seed";
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
} from "@/lib/supabase/mappers";
import {
  toChallengeEntry,
  toCollege,
  toFellowship,
  toInterviewSession,
  toPassport,
  toProjectSubmission,
  toScholarship,
} from "@/lib/supabase/career-mappers";

/**
 * Everything the staff screens show — admin console, trainer views and the
 * campus dashboard — in the same shape the screens used to read from the
 * demo database. RLS decides what is in it: admins get every row, trainers
 * only students in their domains, a college only its own cohort.
 */
export type AdminData = Pick<
  DemoDatabase,
  | "students"
  | "registrations"
  | "payments"
  | "certificates"
  | "submissions"
  | "progress"
  | "communications"
  | "leads"
  | "projectSubmissions"
  | "interviews"
  | "challengeEntries"
  | "passports"
  | "fellowshipApplications"
  | "scholarshipApplications"
  | "colleges"
>;

type Client = SupabaseClient<SupabaseSchema>;
type TableName = keyof SupabaseSchema["public"]["Tables"];
type Row<T extends TableName> = SupabaseSchema["public"]["Tables"][T]["Row"];

const PAGE = 1000;

/**
 * Reads a whole table in pages, since PostgREST caps a response at 1,000
 * rows. Pages are ordered by the primary key so none are skipped or repeated.
 */
async function fetchAll<T extends TableName>(
  supabase: Client,
  table: T,
  primaryKey: string[] = ["id"],
): Promise<Row<T>[]> {
  const rows: Row<T>[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from(table).select("*");
    for (const column of primaryKey) query = query.order(column);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw new Error(`Loading ${table} failed: ${error.message}`);
    const page = (data ?? []) as unknown as Row<T>[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export async function fetchAdminData(supabase: Client): Promise<AdminData> {
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
    fetchAll(supabase, "profiles"),
    fetchAll(supabase, "students"),
    fetchAll(supabase, "registrations"),
    fetchAll(supabase, "payments"),
    fetchAll(supabase, "module_progress", ["student_id", "domain_id"]),
    fetchAll(supabase, "assessment_attempts"),
    fetchAll(supabase, "submissions"),
    fetchAll(supabase, "certificates"),
    fetchAll(supabase, "communication_logs"),
    fetchAll(supabase, "college_leads"),
    fetchAll(supabase, "project_submissions"),
    fetchAll(supabase, "interview_sessions"),
    fetchAll(supabase, "challenge_entries"),
    fetchAll(supabase, "career_passports", ["student_id"]),
    fetchAll(supabase, "fellowship_applications"),
    fetchAll(supabase, "scholarship_applications"),
    fetchAll(supabase, "colleges"),
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
