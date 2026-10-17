import "server-only";

import { getDomainAssessments } from "@/data/domains";
import { careerSnapshot } from "@/lib/career-rules";
import { service } from "@/lib/server/db";
import type { PassportRow } from "@/lib/records/career-mappers";
import { toPassport } from "@/lib/records/career-mappers";
import { toStudentRecords } from "@/lib/records/mappers";
import { fetchStudentRecordRows } from "@/lib/server/student-records";
import type { PublicProfileView } from "@/types";

/**
 * A published Career Passport as the public sees it. Only the sections the
 * student switched on are filled in; everything else is null or empty, so
 * hidden data never leaves the server.
 */
export async function buildPublicProfile(passportRow: PassportRow): Promise<PublicProfileView | null> {
  if (!passportRow.published) return null;
  const rows = await service((tx) => fetchStudentRecordRows(tx, passportRow.student_id));
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

export async function publicProfileBySlug(slug: string): Promise<PublicProfileView | null> {
  const [row] = await service(
    (tx) => tx<PassportRow[]>`
      select * from public.career_passports where slug = ${slug.toLowerCase()} and published`,
  );
  return row ? buildPublicProfile(row) : null;
}

/** Every published passport, for the partner talent directory. */
export async function publishedProfiles(): Promise<PublicProfileView[]> {
  const rows = await service(
    (tx) => tx<PassportRow[]>`
      select * from public.career_passports where published order by updated_at desc limit 500`,
  );
  const views: PublicProfileView[] = [];
  for (const row of rows) {
    const view = await buildPublicProfile(row);
    if (view) views.push(view);
  }
  return views;
}
