/* ------------------------------------------------------------------ */
/*  Core domain models for the Roystian Foundation demo platform        */
/* ------------------------------------------------------------------ */

export type Role = "student" | "admin" | "trainer" | "college" | "partner";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type EducationLevel =
  | "intermediate"
  | "diploma"
  | "undergraduate"
  | "postgraduate"
  | "working-professional";

export type ProgramId = "self-paced" | "industry-led";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  password: string;
  avatarColor: string;
  createdAt: string;
  isDemoSeed?: boolean;
  /** College placement-cell accounts only: the linked college record. */
  collegeId?: string | null;
}

export interface Student extends User {
  role: "student";
  mobile: string;
  educationLevel: EducationLevel;
  college: string;
  course: string;
  city: string;
  domainId: string | null;
  experience: ExperienceLevel | null;
  programId: ProgramId | null;
  registrationId: string | null;
  status: "active" | "suspended" | "completed";
  enrolledAt: string | null;
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
  industry: string;
  experience: string;
  specialization: string;
  linkedin: string;
  bio: string;
  domains: string[];
  initials: string;
  accent: string;
  active: boolean;
}

export interface Concept {
  term: string;
  definition: string;
}

export interface Resource {
  title: string;
  type: "pdf" | "notebook" | "dataset" | "article" | "checklist" | "template";
  meta: string;
}

export interface Module {
  id: string;
  domainId: string;
  number: number;
  title: string;
  summary: string;
  durationMinutes: number;
  /** Estimated reading time for the module material. */
  readMinutes: number;
  objectives: string[];
  concepts: Concept[];
  reading: { heading: string; body: string }[];
  resources: Resource[];
  assessmentId: string;
}

export type QuestionType = "single" | "multiple";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export interface Assessment {
  id: string;
  domainId: string;
  moduleId: string | null;
  kind: "module" | "final";
  title: string;
  description: string;
  passingScore: number;
  durationMinutes: number;
  questions: Question[];
}

export interface PracticalTask {
  title: string;
  brief: string;
  requirements: string[];
  deliverable: string;
  evaluation: string[];
}

export interface Domain {
  id: string;
  name: string;
  shortName: string;
  code: string;
  icon: string;
  tagline: string;
  description: string;
  longDescription: string;
  category: "Technology" | "Data" | "Business" | "Engineering" | "Impact";
  /** Public-facing grouping — the three clusters shown across the site. */
  cluster: DomainCluster;
  whoFor: string[];
  whatYouLearn: string[];
  /** Answers "what will I practise?" — hands-on work inside the track. */
  whatYouPractise: string[];
  /** Answers "what career pathways can these skills support?" */
  careerPathways: string[];
  levels: ExperienceLevel[];
  practicalTask: PracticalTask;
  modules: Module[];
  curriculumSource: "documented" | "demo";
  active: boolean;
}

export interface ProgramFeature {
  label: string;
  /** One line explaining what the row actually means. */
  detail: string;
  selfPaced: boolean;
  industryLed: boolean;
}

export interface Program {
  id: ProgramId;
  name: string;
  /** Marketing name used on the public site — "Career Starter" etc. */
  marketingName: string;
  /** One line on who the programme is for, shown on the comparison. */
  promise: string;
  price: number;
  durationLabel: string;
  tagline: string;
  description: string;
  bestFor: string;
  features: string[];
  /** Stated explicitly so no surface can imply an excluded item is included. */
  excludes: string[];
  certificateEnabled: boolean;
  pehlaChanceIncluded: boolean;
  liveSessions: boolean;
  active: boolean;
}

export type PaymentMethod = "upi" | "card" | "netbanking";
export type PaymentStatus = "successful" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  registrationId: string;
  studentId: string;
  studentName: string;
  amount: number;
  /** Null until the gateway reports how the student paid. */
  method: PaymentMethod | null;
  status: PaymentStatus;
  createdAt: string;
  reference: string;
  /** "simulated" or the gateway name. */
  provider?: string;
}

export type InternshipStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "certified";

export interface Registration {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  college: string;
  course: string;
  domainId: string;
  programId: ProgramId;
  experience: ExperienceLevel;
  amount: number;
  paymentStatus: PaymentStatus;
  internshipStatus: InternshipStatus;
  createdAt: string;
  startDate: string;
}

export interface AssessmentAttempt {
  assessmentId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number[]>;
  submittedAt: string;
  /** Set when an admin recorded this result on the student's behalf. */
  overriddenBy?: string | null;
}

export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "reviewed"
  | "approved"
  | "needs-revision";

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  domainId: string;
  taskTitle: string;
  responseText: string;
  fileName: string | null;
  /** Private storage path of the uploaded file, when there is one. */
  filePath?: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface Progress {
  studentId: string;
  domainId: string;
  completedModules: string[];
  moduleAttempts: Record<string, AssessmentAttempt>;
  finalAttempt: AssessmentAttempt | null;
  notes: Record<string, string>;
  lastModuleId: string | null;
  updatedAt: string;
}

export type CertificateStatus = "valid" | "revoked";

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  domainId: string;
  domainName: string;
  programId: ProgramId;
  programName: string;
  duration: string;
  issueDate: string;
  status: CertificateStatus;
  registrationId: string;
  finalScore: number;
}

export type NotificationType =
  | "success"
  | "reminder"
  | "assessment"
  | "assignment"
  | "certificate"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface ScheduleItem {
  id: string;
  day: number;
  date: string;
  topic: string;
  phase: string;
  trainerId: string;
  time: string;
  status: "completed" | "live" | "upcoming";
  type: "session" | "workshop" | "review" | "evaluation";
}

export interface CollegeLead {
  id: string;
  collegeName: string;
  city: string;
  state: string;
  institutionType: InstitutionType | "";
  departments: string;
  yearBatch: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  studentCount: string;
  interest: string;
  message: string;
  status: "new" | "contacted" | "scheduled" | "closed";
  createdAt: string;
}

export type CommunicationChannel =
  | "email"
  | "whatsapp"
  | "dashboard"
  | "internal";

export type CommunicationEvent =
  | "payment-success"
  | "program-approaching"
  | "program-completed"
  | "assessment-reminder"
  | "assignment-reviewed";

export interface CommunicationLog {
  id: string;
  event: CommunicationEvent;
  channel: CommunicationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: "sent" | "queued" | "failed";
  createdAt: string;
}

export interface OnboardingDraft {
  fullName: string;
  email: string;
  mobile: string;
  educationLevel: EducationLevel | "";
  college: string;
  course: string;
  city: string;
  domainId: string | null;
  experience: ExperienceLevel | null;
  programId: ProgramId | null;
}

export interface CompletionRequirement {
  key: string;
  label: string;
  done: boolean;
  detail: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/*  V2 — Student Career & Industry Readiness Platform                   */
/* ------------------------------------------------------------------ */

/**
 * The three public-facing clusters the 12 domains are grouped into.
 * Derived from the finer-grained `category` — see CLUSTER_OF in data/domains.
 */
export type DomainCluster =
  | "Technology"
  | "Data & Business"
  | "Emerging & Engineering";

/* ---------------------------- Projects ---------------------------- */

/**
 * A structured, industry-style project brief. Unlike a practical task, the
 * student is handed a problem statement, a dataset and explicit evaluation
 * criteria, and produces analysis, recommendations and a report.
 */
export interface ProjectBrief {
  id: string;
  domainId: string;
  title: string;
  /** Which programme unlocks it. Industry-Led adds the advanced brief. */
  tier: "core" | "advanced";
  scenario: string;
  problemStatement: string;
  dataset: { name: string; description: string; rows: string; format: string };
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: { label: string; weight: number; detail: string }[];
  skillsDemonstrated: string[];
  estimatedHours: number;
}

export type ProjectStatus =
  | "not-started"
  | "in-progress"
  | "submitted"
  | "evaluated";

export interface ProjectSubmission {
  id: string;
  studentId: string;
  projectId: string;
  domainId: string;
  status: ProjectStatus;
  /** Student's written analysis and solution. */
  analysis: string;
  /** Results and recommendations drawn from the analysis. */
  recommendations: string;
  reportFileName: string | null;
  repoUrl: string | null;
  /** Score per evaluation criterion, keyed by criterion label. 0–100. */
  criterionScores: Record<string, number>;
  overallScore: number | null;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
}

/* ----------------------- Career readiness ------------------------- */

export type ReadinessArea =
  | "technical-skills"
  | "practical-application"
  | "problem-solving"
  | "communication"
  | "project-execution";

export interface ReadinessBreakdown {
  area: ReadinessArea;
  label: string;
  score: number;
  /** Plain-English account of what produced this number. */
  basis: string;
  /** False when the student has not yet generated any evidence for the area. */
  hasEvidence: boolean;
}

export interface CareerReadiness {
  /** 0–100, weighted across the five areas. */
  score: number;
  breakdown: ReadinessBreakdown[];
  strengths: string[];
  improveNext: string[];
  /** How much of the underlying evidence exists yet, 0–100. */
  evidenceCoverage: number;
  updatedAt: string;
}

/* --------------------------- Skill badges -------------------------- */

export type BadgeId =
  | "domain-fundamentals"
  | "data-analysis"
  | "applied-practice"
  | "problem-solving"
  | "project-execution"
  | "industry-challenge"
  | "career-ready";

export interface SkillBadge {
  id: BadgeId;
  name: string;
  icon: string;
  description: string;
  /** What the student must actually do. Shown whether earned or not. */
  criteria: string;
}

export interface EarnedBadge {
  badgeId: BadgeId;
  earnedAt: string;
  /** The concrete achievement that unlocked it. */
  evidence: string;
}

/* ------------------------- Career tooling -------------------------- */

export interface ResumeDraft {
  studentId: string;
  headline: string;
  summary: string;
  /** Skills the student chose to surface, drawn from earned evidence. */
  skills: string[];
  includeProjects: boolean;
  includeAssessments: boolean;
  includeCertificate: boolean;
  updatedAt: string;
}

export type LinkedInSection =
  | "headline"
  | "about"
  | "internship"
  | "project"
  | "skills"
  | "achievements";

export interface LinkedInDraft {
  studentId: string;
  sections: Record<LinkedInSection, string>;
  updatedAt: string;
}

export type InterviewKind = "technical" | "hr" | "project";

export interface InterviewQuestion {
  id: string;
  kind: InterviewKind;
  prompt: string;
  /** What a strong answer covers — shown after the student responds. */
  lookingFor: string[];
  followUp: string;
}

export interface InterviewSession {
  id: string;
  studentId: string;
  kind: InterviewKind;
  domainId: string;
  answers: Record<string, string>;
  /** 0–100 per competency, derived from answer substance. */
  scores: { clarity: number; structure: number; depth: number };
  overallScore: number;
  strengths: string[];
  improvements: string[];
  completedAt: string;
}

/* ------------------------ Career Passport -------------------------- */

export interface CareerPassport {
  studentId: string;
  /** Public slug for the shareable profile at /profile/<slug>. */
  slug: string;
  published: boolean;
  headline: string;
  about: string;
  /** Student controls what the public profile exposes. */
  visibility: {
    readiness: boolean;
    projects: boolean;
    assessments: boolean;
    badges: boolean;
    certificate: boolean;
    contact: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

/* ------------------------ Opportunity engine ----------------------- */

export type ChallengeKind =
  | "ai"
  | "coding"
  | "data"
  | "software-testing"
  | "business-case"
  | "sustainability";

export interface Challenge {
  id: string;
  kind: ChallengeKind;
  title: string;
  icon: string;
  summary: string;
  brief: string;
  /** Domains this challenge is most relevant to; empty means open to all. */
  domainIds: string[];
  requirements: string[];
  evaluationCriteria: string[];
  durationLabel: string;
  difficulty: "foundation" | "intermediate" | "advanced";
  active: boolean;
}

export type ChallengeEntryStatus = "draft" | "submitted" | "evaluated";

export interface ChallengeEntry {
  id: string;
  studentId: string;
  challengeId: string;
  status: ChallengeEntryStatus;
  approach: string;
  solution: string;
  repoUrl: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
}

export type FellowshipStage =
  | "not-eligible"
  | "eligible"
  | "applied"
  | "shortlisted"
  | "interview"
  | "selected"
  | "not-selected";

export interface FellowshipApplication {
  id: string;
  studentId: string;
  stage: FellowshipStage;
  /** Readiness score at the moment of application — frozen for fairness. */
  readinessAtApply: number;
  motivation: string;
  availableFrom: string;
  canRelocate: boolean;
  preferredArea: string;
  appliedAt: string | null;
  updatedAt: string;
}

export interface EligibilityCriterion {
  key: string;
  label: string;
  met: boolean;
  detail: string;
  href: string;
}

export type ScholarshipTier = 100 | 75 | 50;

export interface ScholarshipApplication {
  id: string;
  studentId: string;
  requestedTier: ScholarshipTier;
  awardedTier: ScholarshipTier | null;
  householdIncomeBand: string;
  category: string;
  statement: string;
  status: "submitted" | "under-review" | "approved" | "declined";
  createdAt: string;
  decidedAt: string | null;
}

/* --------------------------- Institutions -------------------------- */

export type InstitutionType =
  | "engineering"
  | "degree"
  | "university"
  | "training";

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  type: InstitutionType;
  departments: string[];
  /** Login handle for the college placement team. */
  contactEmail: string;
  contactPerson: string;
  designation: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface SkillSignal {
  skill: string;
  /** Cohort average, 0–100. */
  score: number;
  studentCount: number;
}

export interface SkillGapReport {
  collegeId: string;
  collegeName: string;
  cohortSize: number;
  strengths: SkillSignal[];
  gaps: SkillSignal[];
  recommendedInterventions: {
    title: string;
    rationale: string;
    format: string;
  }[];
  generatedAt: string;
}

export interface CampusMetrics {
  enrolled: number;
  active: number;
  completed: number;
  projects: number;
  avgAssessment: number;
  careerReady: number;
}
