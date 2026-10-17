import "server-only";

import type { Tx } from "@/lib/server/db";
import type { StudentRecordRows } from "@/lib/records/mappers";

/**
 * Loads every record the student journey needs for one student. Pass a
 * transaction from withUser() (RLS-scoped to what the caller may see) or from
 * service() (trusted server decisions).
 */
export async function fetchStudentRecordRows(
  tx: Tx,
  studentId: string,
): Promise<StudentRecordRows | null> {
  const [profile] = await tx`select * from public.profiles where id = ${studentId}`;
  const [student] = await tx`select * from public.students where id = ${studentId}`;
  if (!profile || !student) return null;

  const registrations = await tx`select * from public.registrations where student_id = ${studentId}`;
  const progress = await tx`select * from public.module_progress where student_id = ${studentId}`;
  const attempts = await tx`select * from public.assessment_attempts where student_id = ${studentId}`;
  const submissions = await tx`select * from public.submissions where student_id = ${studentId}`;
  const certificates = await tx`select * from public.certificates where student_id = ${studentId}`;
  const projects = await tx`select * from public.project_submissions where student_id = ${studentId}`;
  const interviews = await tx`select * from public.interview_sessions where student_id = ${studentId}`;
  const challenges = await tx`select * from public.challenge_entries where student_id = ${studentId}`;
  const [passport] = await tx`select * from public.career_passports where student_id = ${studentId}`;
  const [resume] = await tx`select * from public.resume_drafts where student_id = ${studentId}`;
  const [linkedin] = await tx`select * from public.linkedin_drafts where student_id = ${studentId}`;
  const [fellowship] = await tx`select * from public.fellowship_applications where student_id = ${studentId}`;
  const scholarships = await tx`select * from public.scholarship_applications where student_id = ${studentId}`;

  return {
    profile,
    student,
    registrations: [...registrations],
    progress: [...progress],
    attempts: [...attempts],
    submissions: [...submissions],
    certificates: [...certificates],
    projects: [...projects],
    interviews: [...interviews],
    challenges: [...challenges],
    passport: passport ?? null,
    resume: resume ?? null,
    linkedin: linkedin ?? null,
    fellowship: fellowship ?? null,
    scholarships: [...scholarships],
  } as unknown as StudentRecordRows;
}
