import "server-only";

import { getDomainAssessments } from "@/data/domains";
import { careerSnapshot } from "@/lib/career-rules";
import type { AdminClient } from "@/lib/server/staff";
import type { PassportRow } from "@/lib/supabase/career-mappers";
import { toPassport } from "@/lib/supabase/career-mappers";
import { toStudentRecords } from "@/lib/supabase/mappers";
import { fetchStudentRecordRows } from "@/lib/supabase/student-records";
import type { PublicProfileView } from "@/types";

/**
 * A published Career Passport as the public sees it. Only the sections the
 * student switched on are filled in; everything else is null or empty, so
 * hidden data never leaves the server.
 */
export async function buildPublicProfile(
  admin: AdminClient,
  passportRow: PassportRow,
): Promise<PublicProfileView | null> {
  if (!passportRow.published) return null;
  const rows = await fetchStudentRecordRows(admin, passportRow.student_id);
  if (!rows || rows.profile.role !== "student") return null;

  const passport = toPassport(passportRow);
  const { visibility } = passport;
  const records = toStudentRecords(rows);
  const { student, progress, submission, projects, interviews, challenges, certificates } = records;
  const { readiness, badges } = careerSnapshot({
    student,
    progress,
    submission,
    projects,
    interviews,
    challenges,
  });

  const assessments = student.domainId ? getDomainAssessments(student.domainId) : [];
  const certificate = certificates.find((c) => c.domainId === student.domainId && c.status === "valid");

  return {
    slug: passport.slug,
    headline: passport.headline,
    about: passport.about,
    visibility,
    student: {
      name: student.name,
      college: student.college,
      course: student.course,
      email: visibility.contact ? student.email : null,
      domainId: student.domainId,
    },
    readiness: visibility.readiness ? readiness : null,
    badges: visibility.badges ? badges.filter((b) => b.earned) : [],
    projects: visibility.projects
      ? projects
          .filter((p) => p.status === "evaluated")
          .map((p) => ({ id: p.id, projectId: p.projectId, overallScore: p.overallScore }))
      : [],
    assessments: visibility.assessments
      ? {
          total: assessments.length,
          passed: assessments.flatMap((a) => {
            const attempt = progress?.moduleAttempts?.[a.id];
            return attempt?.passed ? [{ id: a.id, percentage: attempt.percentage }] : [];
          }),
          finalPercentage: progress?.finalAttempt?.passed ? progress.finalAttempt.percentage : null,
        }
      : null,
    certificate:
      visibility.certificate && certificate
        ? {
            id: certificate.id,
            domainName: certificate.domainName,
            programName: certificate.programName,
            issueDate: certificate.issueDate,
          }
        : null,
  };
}

export async function publicProfileBySlug(
  admin: AdminClient,
  slug: string,
): Promise<PublicProfileView | null> {
  const { data } = await admin
    .from("career_passports")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .eq("published", true)
    .maybeSingle();
  return data ? buildPublicProfile(admin, data) : null;
}

/** Every published passport, for the partner talent directory. */
export async function publishedProfiles(admin: AdminClient): Promise<PublicProfileView[]> {
  const { data } = await admin.from("career_passports").select("*").eq("published", true).limit(500);
  const views = await Promise.all((data ?? []).map((row) => buildPublicProfile(admin, row)));
  return views.filter((v): v is PublicProfileView => v !== null);
}
