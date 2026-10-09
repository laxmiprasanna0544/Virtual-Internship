import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { StudentRecordRows } from "@/lib/supabase/mappers";

/**
 * Loads every record the student journey needs for one student. Works with
 * the browser client (RLS-scoped to the signed-in student) and with the
 * service-role client on the server.
 */
export async function fetchStudentRecordRows(
  supabase: SupabaseClient<Database>,
  studentId: string,
): Promise<StudentRecordRows | null> {
  const [profile, student, registrations, progress, attempts, submissions, certificates] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", studentId).maybeSingle(),
      supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
      supabase.from("registrations").select("*").eq("student_id", studentId),
      supabase.from("module_progress").select("*").eq("student_id", studentId),
      supabase.from("assessment_attempts").select("*").eq("student_id", studentId),
      supabase.from("submissions").select("*").eq("student_id", studentId),
      supabase.from("certificates").select("*").eq("student_id", studentId),
    ]);

  const failed = [profile, student, registrations, progress, attempts, submissions, certificates].find(
    (result) => result.error,
  );
  if (failed?.error) throw new Error(`Loading student records failed: ${failed.error.message}`);
  if (!profile.data || !student.data) return null;

  return {
    profile: profile.data,
    student: student.data,
    registrations: registrations.data ?? [],
    progress: progress.data ?? [],
    attempts: attempts.data ?? [],
    submissions: submissions.data ?? [],
    certificates: certificates.data ?? [],
  };
}
