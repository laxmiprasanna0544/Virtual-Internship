/**
 * Supabase rows → the app's domain types.
 *
 * Screens and the rules in lib/rules.ts work on the types in types/index.ts.
 * These mappers are the only place that knows the database column names, and
 * they run unchanged in the browser and on the server.
 */

import type { Database } from "@/types/supabase";
import type {
  AppNotification,
  AssessmentAttempt,
  Certificate,
  CollegeLead,
  CommunicationLog,
  Payment,
  Progress,
  Registration,
  Student,
  Submission,
} from "@/types";

type Tables = Database["public"]["Tables"];
export type ProfileRow = Tables["profiles"]["Row"];
export type StudentRow = Tables["students"]["Row"];
export type RegistrationRow = Tables["registrations"]["Row"];
export type ModuleProgressRow = Tables["module_progress"]["Row"];
export type AttemptRow = Tables["assessment_attempts"]["Row"];
export type SubmissionRow = Tables["submissions"]["Row"];
export type CertificateRow = Tables["certificates"]["Row"];
export type NotificationRow = Tables["notifications"]["Row"];
export type PaymentRow = Tables["payments"]["Row"];
export type CommunicationRow = Tables["communication_logs"]["Row"];
export type LeadRow = Tables["college_leads"]["Row"];

export const paiseToRupees = (paise: number) => paise / 100;
export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

export function toStudent(profile: ProfileRow, row: StudentRow): Student {
  return {
    id: profile.id,
    role: "student",
    name: profile.full_name,
    email: profile.email.toLowerCase(),
    password: "",
    avatarColor: profile.avatar_color,
    createdAt: profile.created_at,
    mobile: row.mobile,
    educationLevel: row.education_level,
    college: row.college,
    course: row.course,
    city: row.city,
    domainId: row.domain_id,
    experience: row.experience,
    programId: row.program_id,
    registrationId: row.active_registration_id,
    status: row.status,
    enrolledAt: row.enrolled_at,
  };
}

export function toRegistration(row: RegistrationRow, student: Student): Registration {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: student.name,
    email: student.email,
    college: student.college,
    course: student.course,
    domainId: row.domain_id,
    programId: row.program_id,
    experience: row.experience,
    amount: paiseToRupees(row.amount_paise),
    paymentStatus: row.payment_status,
    internshipStatus: row.internship_status,
    createdAt: row.created_at,
    startDate: row.start_date ?? row.created_at,
  };
}

export function toAttempt(row: AttemptRow): AssessmentAttempt {
  return {
    assessmentId: row.assessment_id,
    score: row.score,
    total: row.total,
    percentage: Number(row.percentage),
    passed: row.passed,
    answers: (row.answers ?? {}) as Record<string, number[]>,
    submittedAt: row.submitted_at,
    overriddenBy: row.overridden_by,
  };
}

/** Keeps the best attempt per assessment; ties go to the latest. */
function better(current: AssessmentAttempt | undefined, next: AssessmentAttempt) {
  if (!current) return next;
  if (next.percentage > current.percentage) return next;
  if (next.percentage === current.percentage && next.submittedAt > current.submittedAt) {
    return next;
  }
  return current;
}

export function toProgress(
  studentId: string,
  domainId: string,
  row: ModuleProgressRow | null,
  attempts: AttemptRow[],
): Progress {
  const moduleAttempts: Record<string, AssessmentAttempt> = {};
  let finalAttempt: AssessmentAttempt | null = null;

  for (const attemptRow of attempts) {
    if (attemptRow.domain_id !== domainId) continue;
    const attempt = toAttempt(attemptRow);
    if (attemptRow.kind === "final") {
      finalAttempt = better(finalAttempt ?? undefined, attempt);
    } else {
      moduleAttempts[attempt.assessmentId] = better(moduleAttempts[attempt.assessmentId], attempt);
    }
  }

  return {
    studentId,
    domainId,
    completedModules: row?.completed_modules ?? [],
    moduleAttempts,
    finalAttempt,
    notes: (row?.notes ?? {}) as Record<string, string>,
    lastModuleId: row?.last_module_id ?? null,
    updatedAt: row?.updated_at ?? new Date(0).toISOString(),
  };
}

export function toSubmission(row: SubmissionRow, studentName: string): Submission {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName,
    domainId: row.domain_id,
    taskTitle: row.task_title,
    responseText: row.response_text,
    fileName: row.file_name,
    filePath: row.file_path,
    status: row.status,
    feedback: row.feedback,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

export function toCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    domainId: row.domain_id,
    domainName: row.domain_name,
    programId: row.program_id,
    programName: row.program_name,
    duration: row.duration,
    issueDate: row.issue_date,
    status: row.status,
    registrationId: row.registration_id,
    finalScore: Number(row.final_score),
  };
}

export function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as AppNotification["type"],
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: row.read,
    href: row.href ?? undefined,
  };
}

export function toPayment(row: PaymentRow, studentName: string): Payment {
  return {
    id: row.id,
    registrationId: row.registration_id ?? "",
    studentId: row.student_id,
    studentName,
    amount: paiseToRupees(row.amount_paise),
    method: row.method,
    status: row.status,
    createdAt: row.created_at,
    reference: row.provider_payment_id ?? row.provider_order_id,
    provider: row.provider,
  };
}

export function toCommunication(row: CommunicationRow): CommunicationLog {
  return {
    id: row.id,
    event: row.event as CommunicationLog["event"],
    channel: row.channel as CommunicationLog["channel"],
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    status: row.status as CommunicationLog["status"],
    createdAt: row.created_at,
  };
}

export function toLead(row: LeadRow): CollegeLead {
  return {
    id: row.id,
    collegeName: row.college_name,
    city: row.city,
    state: row.state,
    institutionType: row.institution_type ?? "",
    departments: row.departments,
    yearBatch: row.year_batch,
    contactPerson: row.contact_person,
    designation: row.designation,
    email: row.email,
    phone: row.phone,
    studentCount: row.student_count,
    interest: row.interest,
    message: row.message,
    status: row.status as CollegeLead["status"],
    createdAt: row.created_at,
  };
}

/** Every record the student journey needs, as fetched from Supabase. */
export interface StudentRecordRows {
  profile: ProfileRow;
  student: StudentRow;
  registrations: RegistrationRow[];
  progress: ModuleProgressRow[];
  attempts: AttemptRow[];
  submissions: SubmissionRow[];
  certificates: CertificateRow[];
}

export interface StudentRecords {
  student: Student;
  registrations: Registration[];
  /** Progress for the active domain (empty progress when none recorded yet). */
  progress: Progress | null;
  /** Practical submission for the active domain. */
  submission: Submission | null;
  certificates: Certificate[];
}

export function toStudentRecords(rows: StudentRecordRows): StudentRecords {
  const student = toStudent(rows.profile, rows.student);
  const domainId = student.domainId;
  const progressRow = rows.progress.find((p) => p.domain_id === domainId) ?? null;
  const submissionRow = rows.submissions.find((s) => s.domain_id === domainId) ?? null;

  return {
    student,
    registrations: rows.registrations
      .map((r) => toRegistration(r, student))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    progress: domainId ? toProgress(student.id, domainId, progressRow, rows.attempts) : null,
    submission: submissionRow ? toSubmission(submissionRow, student.name) : null,
    certificates: rows.certificates
      .map(toCertificate)
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
  };
}
