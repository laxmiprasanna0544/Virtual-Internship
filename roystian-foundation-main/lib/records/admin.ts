import type {
  CareerPassport,
  Certificate,
  ChallengeEntry,
  College,
  CollegeLead,
  CommunicationLog,
  FellowshipApplication,
  InterviewSession,
  Payment,
  ProjectSubmission,
  Progress,
  Registration,
  ScholarshipApplication,
  Student,
  Submission,
} from "@/types";

/**
 * Everything the staff screens show — admin console, trainer views and the
 * campus dashboard. Loaded by GET /api/admin/data under the caller's own row
 * level security: admins get every row, trainers only students in their
 * domains, a college only its own cohort.
 */
export interface AdminData {
  students: Student[];
  registrations: Registration[];
  payments: Payment[];
  certificates: Certificate[];
  submissions: Submission[];
  progress: Progress[];
  communications: CommunicationLog[];
  leads: CollegeLead[];
  projectSubmissions: ProjectSubmission[];
  interviews: InterviewSession[];
  challengeEntries: ChallengeEntry[];
  passports: CareerPassport[];
  fellowshipApplications: FellowshipApplication[];
  scholarshipApplications: ScholarshipApplication[];
  colleges: College[];
}
