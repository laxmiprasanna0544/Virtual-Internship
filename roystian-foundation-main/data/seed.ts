import { DOMAINS, getDomain, getFinalAssessment } from "@/data/domains";
import { projectsForDomain } from "@/data/projects";
import { challengesForDomain } from "@/data/challenges";
import { PROGRAMS } from "@/data/programs";
import { TRAINERS } from "@/data/trainers";
import { buildCertificateId, buildRegistrationId } from "@/lib/ids";
import { seededInt } from "@/lib/random";
import type {
  AppNotification,
  CareerPassport,
  Certificate,
  ChallengeEntry,
  College,
  CollegeLead,
  CommunicationLog,
  FellowshipApplication,
  InterviewSession,
  LinkedInDraft,
  Payment,
  PaymentMethod,
  Progress,
  ProjectSubmission,
  Registration,
  ResumeDraft,
  ScholarshipApplication,
  Student,
  Submission,
  Trainer,
  User,
} from "@/types";

export interface Database {
  version: number;
  seededAt: string;
  students: Student[];
  staff: User[];
  registrations: Registration[];
  payments: Payment[];
  certificates: Certificate[];
  submissions: Submission[];
  progress: Progress[];
  notifications: AppNotification[];
  leads: CollegeLead[];
  communications: CommunicationLog[];
  /* --- V2: career & opportunity collections --- */
  projectSubmissions: ProjectSubmission[];
  interviews: InterviewSession[];
  challengeEntries: ChallengeEntry[];
  passports: CareerPassport[];
  resumes: ResumeDraft[];
  linkedInDrafts: LinkedInDraft[];
  fellowshipApplications: FellowshipApplication[];
  scholarshipApplications: ScholarshipApplication[];
  colleges: College[];
  programOverrides: Record<string, Partial<(typeof PROGRAMS)[number]>>;
  domainOverrides: Record<
    string,
    { description?: string; active?: boolean; practicalBrief?: string }
  >;
  trainerOverrides: Record<string, Partial<(typeof TRAINERS)[number]>>;
  customPrograms: CustomProgram[];
  customTrainers: Trainer[];
  counters: { registration: number; certificate: number; payment: number };
}

export interface CustomProgram {
  id: string;
  name: string;
  price: number;
  durationLabel: string;
  tagline: string;
  description: string;
  bestFor: string;
  features: string[];
  certificateEnabled: boolean;
  pehlaChanceIncluded: boolean;
  liveSessions: boolean;
  active: boolean;
}

export const DB_VERSION = 2;

function iso(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
}

function futureIso(daysAhead: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const AVATAR_COLORS = [
  "indigo",
  "violet",
  "teal",
  "amber",
  "rose",
  "emerald",
  "sky",
];

interface SeedPerson {
  name: string;
  email: string;
  college: string;
  course: string;
  city: string;
  domainId: string;
  programId: "self-paced" | "industry-led";
  experience: "beginner" | "intermediate" | "advanced";
  education: Student["educationLevel"];
  /** fraction of modules completed, 0..1 */
  progress: number;
  daysAgo: number;
  method: PaymentMethod;
  status?: Student["status"];
}

const PEOPLE: SeedPerson[] = [
  {
    name: "Rahul Sharma",
    email: "student@roystian.demo",
    college: "Vignan Institute of Technology",
    course: "B.Tech Computer Engineering",
    city: "Hyderabad",
    domainId: "ai-ml",
    programId: "industry-led",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.4,
    daysAgo: 9,
    method: "upi",
  },
  {
    name: "Priya Verma",
    email: "priya.verma@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.Sc Statistics",
    city: "Hyderabad",
    domainId: "data-analytics",
    programId: "self-paced",
    experience: "intermediate",
    education: "undergraduate",
    progress: 1,
    daysAgo: 38,
    method: "card",
  },
  {
    name: "Ananya Singh",
    email: "ananya.singh@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.Tech Information Technology",
    city: "Hyderabad",
    domainId: "ai-ml",
    programId: "industry-led",
    experience: "advanced",
    education: "undergraduate",
    progress: 1,
    daysAgo: 45,
    method: "netbanking",
  },
  {
    name: "Arjun Mehta",
    email: "arjun.mehta@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.Tech Computer Science",
    city: "Hyderabad",
    domainId: "full-stack-development",
    programId: "industry-led",
    experience: "intermediate",
    education: "undergraduate",
    progress: 1,
    daysAgo: 52,
    method: "upi",
  },
  {
    name: "Neha Gupta",
    email: "neha.gupta@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.Tech Software Engineering",
    city: "Hyderabad",
    domainId: "software-testing",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.7,
    daysAgo: 21,
    method: "card",
  },
  {
    name: "Karthik Iyer",
    email: "karthik.iyer@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.E Electronics",
    city: "Hyderabad",
    domainId: "iot-electronics",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.3,
    daysAgo: 14,
    method: "upi",
  },
  {
    name: "Sanya Kapoor",
    email: "sanya.kapoor@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "MBA Marketing",
    city: "Hyderabad",
    domainId: "sales-marketing",
    programId: "industry-led",
    experience: "intermediate",
    education: "postgraduate",
    progress: 0.6,
    daysAgo: 17,
    method: "netbanking",
  },
  {
    name: "Devansh Patel",
    email: "devansh.patel@demo.roystian.in",
    college: "Vignan Institute of Technology",
    course: "B.E Mechanical",
    city: "Hyderabad",
    domainId: "mechanical-engineering",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.2,
    daysAgo: 6,
    method: "upi",
  },
  {
    name: "Ishita Bose",
    email: "ishita.bose@demo.roystian.in",
    college: "Sri Venkateswara University",
    course: "M.Sc Environmental Science",
    city: "Tirupati",
    domainId: "sustainability",
    programId: "industry-led",
    experience: "advanced",
    education: "postgraduate",
    progress: 0.9,
    daysAgo: 29,
    method: "card",
  },
  {
    name: "Mohit Rana",
    email: "mohit.rana@demo.roystian.in",
    college: "Sri Venkateswara University",
    course: "BCA",
    city: "Tirupati",
    domainId: "python-development",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.5,
    daysAgo: 11,
    method: "upi",
  },
  {
    name: "Tanvi Deshmukh",
    email: "tanvi.deshmukh@demo.roystian.in",
    college: "Sri Venkateswara University",
    course: "B.Tech Computer Engineering",
    city: "Tirupati",
    domainId: "software-development",
    programId: "industry-led",
    experience: "intermediate",
    education: "undergraduate",
    progress: 0.8,
    daysAgo: 24,
    method: "card",
  },
  {
    name: "Aman Khurana",
    email: "aman.khurana@demo.roystian.in",
    college: "Sri Venkateswara University",
    course: "BBA",
    city: "Tirupati",
    domainId: "business-analytics",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.1,
    daysAgo: 3,
    method: "netbanking",
  },
  {
    name: "Rhea Menon",
    email: "rhea.menon@demo.roystian.in",
    college: "BMS College of Engineering",
    course: "B.Tech Information Technology",
    city: "Bengaluru",
    domainId: "java-development",
    programId: "self-paced",
    experience: "intermediate",
    education: "undergraduate",
    progress: 1,
    daysAgo: 41,
    method: "upi",
  },
  {
    name: "Siddharth Jain",
    email: "siddharth.jain@demo.roystian.in",
    college: "BMS College of Engineering",
    course: "B.Tech Electrical",
    city: "Bengaluru",
    domainId: "iot-electronics",
    programId: "industry-led",
    experience: "intermediate",
    education: "undergraduate",
    progress: 0.45,
    daysAgo: 13,
    method: "card",
  },
  {
    name: "Pooja Reddy",
    email: "pooja.reddy@demo.roystian.in",
    college: "BMS College of Engineering",
    course: "M.Sc Data Science",
    city: "Bengaluru",
    domainId: "data-analytics",
    programId: "industry-led",
    experience: "advanced",
    education: "postgraduate",
    progress: 0.75,
    daysAgo: 19,
    method: "upi",
  },
  {
    name: "Vivek Nair",
    email: "vivek.nair@demo.roystian.in",
    college: "BMS College of Engineering",
    course: "Diploma in Computer Engineering",
    city: "Bengaluru",
    domainId: "full-stack-development",
    programId: "self-paced",
    experience: "beginner",
    education: "diploma",
    progress: 0.35,
    daysAgo: 8,
    method: "upi",
  },
  {
    name: "Aarushi Sethi",
    email: "aarushi.sethi@demo.roystian.in",
    college: "Christ University",
    course: "B.Com Honours",
    city: "Bengaluru",
    domainId: "business-analytics",
    programId: "industry-led",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.55,
    daysAgo: 16,
    method: "netbanking",
  },
  {
    name: "Harsh Vardhan",
    email: "harsh.vardhan@demo.roystian.in",
    college: "BIT Mesra",
    course: "B.Tech Production Engineering",
    city: "Ranchi",
    domainId: "mechanical-engineering",
    programId: "industry-led",
    experience: "advanced",
    education: "undergraduate",
    progress: 1,
    daysAgo: 47,
    method: "card",
  },
  {
    name: "Nikita Joshi",
    email: "nikita.joshi@demo.roystian.in",
    college: "Fergusson College",
    course: "B.Sc Computer Science",
    city: "Pune",
    domainId: "software-testing",
    programId: "industry-led",
    experience: "intermediate",
    education: "undergraduate",
    progress: 0.65,
    daysAgo: 18,
    method: "upi",
  },
  {
    name: "Rohit Bansal",
    email: "rohit.bansal@demo.roystian.in",
    college: "Thapar Institute",
    course: "B.E Computer Engineering",
    city: "Patiala",
    domainId: "software-development",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.15,
    daysAgo: 4,
    method: "upi",
    status: "suspended",
  },
  {
    name: "Shreya Kulkarni",
    email: "shreya.kulkarni@demo.roystian.in",
    college: "COEP Technological University",
    course: "B.Tech Instrumentation",
    city: "Pune",
    domainId: "python-development",
    programId: "industry-led",
    experience: "intermediate",
    education: "undergraduate",
    progress: 0.85,
    daysAgo: 26,
    method: "card",
  },
  {
    name: "Faizan Ahmed",
    email: "faizan.ahmed@demo.roystian.in",
    college: "Jamia Millia Islamia",
    course: "B.Tech Civil Engineering",
    city: "New Delhi",
    domainId: "sustainability",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.25,
    daysAgo: 7,
    method: "netbanking",
  },
  {
    name: "Meghna Dutta",
    email: "meghna.dutta@demo.roystian.in",
    college: "NIT Silchar",
    course: "B.Tech Computer Science",
    city: "Silchar",
    domainId: "java-development",
    programId: "industry-led",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.5,
    daysAgo: 12,
    method: "upi",
  },
  {
    name: "Yash Agarwal",
    email: "yash.agarwal@demo.roystian.in",
    college: "IIM Indore (IPM)",
    course: "Integrated Programme in Management",
    city: "Indore",
    domainId: "sales-marketing",
    programId: "self-paced",
    experience: "beginner",
    education: "undergraduate",
    progress: 0.9,
    daysAgo: 22,
    method: "card",
  },
];

function studentId(index: number): string {
  return `stu_${String(index + 1).padStart(3, "0")}`;
}

function programPrice(id: "self-paced" | "industry-led"): number {
  return id === "industry-led" ? 5000 : 1500;
}

/** Certificate IDs quoted in the product documentation. */
const FIXED_CERTIFICATE_IDS: Record<string, string> = {
  "Ananya Singh": "RF-AIML-2026-000184",
  "Priya Verma": "RF-DA-2026-001284",
  "Arjun Mehta": "RF-FS-2026-001101",
};

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

/** Stable, readable public slug for a demo Career Passport. */
function passportSlug(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${String(index + 1).padStart(3, "0")}`;
}

/** Institutions used by the college platform demo. */
const SEED_COLLEGES: Omit<College, "createdAt">[] = [
  {
    id: "college_vjit",
    name: "Vignan Institute of Technology",
    city: "Hyderabad",
    state: "Telangana",
    type: "engineering",
    departments: ["CSE", "ECE", "Mechanical", "IT"],
    contactEmail: "college@roystian.demo",
    contactPerson: "Dr. A. Sharma",
    designation: "Training & Placement Officer",
    phone: "+91 90000 00001",
    active: true,
  },
  {
    id: "college_svu",
    name: "Sri Venkateswara University",
    city: "Tirupati",
    state: "Andhra Pradesh",
    type: "university",
    departments: ["CSE", "Statistics", "Commerce"],
    contactEmail: "tpo@svu.demo",
    contactPerson: "Prof. R. Lakshmi",
    designation: "Dean, Career Services",
    phone: "+91 90000 00002",
    active: true,
  },
  {
    id: "college_bmsce",
    name: "BMS College of Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    type: "engineering",
    departments: ["CSE", "ISE", "Mechanical"],
    contactEmail: "placements@bmsce.demo",
    contactPerson: "Mr. K. Suresh",
    designation: "Placement Head",
    phone: "+91 90000 00003",
    active: true,
  },
];

export function buildSeedDatabase(): Database {
  const students: Student[] = [];
  const registrations: Registration[] = [];
  const payments: Payment[] = [];
  const progress: Progress[] = [];
  const certificates: Certificate[] = [];
  const submissions: Submission[] = [];
  const notifications: AppNotification[] = [];
  const communications: CommunicationLog[] = [];
  const projectSubmissions: ProjectSubmission[] = [];
  const interviewSessions: InterviewSession[] = [];
  const challengeEntries: ChallengeEntry[] = [];
  const passports: CareerPassport[] = [];
  const colleges: College[] = SEED_COLLEGES.map((c) => ({
    ...c,
    createdAt: iso(120),
  }));

  let registrationSeq = 100;
  let certificateSeq = 1000;
  let paymentSeq = 1;

  PEOPLE.forEach((person, index) => {
    const id = studentId(index);
    const domain = getDomain(person.domainId);
    if (!domain) return;

    registrationSeq += seededInt(`reg-${id}`, 3, 19);
    const registrationId = buildRegistrationId(
      person.domainId,
      registrationSeq,
      2026,
    );
    const createdAt = iso(person.daysAgo);
    const amount = programPrice(person.programId);
    const moduleCount = domain.modules.length;
    const completedCount = Math.round(person.progress * moduleCount);
    const completedModules = domain.modules
      .slice(0, completedCount)
      .map((m) => m.id);
    const isComplete = completedCount === moduleCount;

    students.push({
      id,
      role: "student",
      name: person.name,
      email: person.email,
      password: person.email === "student@roystian.demo" ? "student123" : "demo1234",
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      createdAt,
      isDemoSeed: true,
      mobile: `+91 9${String(800000000 + index * 137911).slice(0, 9)}`,
      educationLevel: person.education,
      college: person.college,
      course: person.course,
      city: person.city,
      domainId: person.domainId,
      experience: person.experience,
      programId: person.programId,
      registrationId,
      status: person.status ?? (isComplete ? "completed" : "active"),
      enrolledAt: createdAt,
    });

    registrations.push({
      id: registrationId,
      studentId: id,
      studentName: person.name,
      email: person.email,
      college: person.college,
      course: person.course,
      domainId: person.domainId,
      programId: person.programId,
      experience: person.experience,
      amount,
      paymentStatus: "successful",
      internshipStatus: isComplete
        ? "certified"
        : completedCount > 0
          ? "in-progress"
          : "not-started",
      createdAt,
      startDate: createdAt,
    });

    payments.push({
      id: `PAY-${String(paymentSeq++).padStart(7, "0")}`,
      registrationId,
      studentId: id,
      studentName: person.name,
      amount,
      method: person.method,
      status: "successful",
      createdAt,
      reference: `${person.method.toUpperCase()}-${registrationSeq}${index}A`,
    });

    // Module assessment attempts for every completed module.
    const moduleAttempts: Progress["moduleAttempts"] = {};
    domain.modules.slice(0, completedCount).forEach((module, mIndex) => {
      const total = 5;
      const score = seededInt(`${id}-${module.id}-score`, 4, 5);
      moduleAttempts[module.assessmentId] = {
        assessmentId: module.assessmentId,
        score,
        total,
        percentage: Math.round((score / total) * 100),
        passed: true,
        answers: {},
        submittedAt: iso(Math.max(1, person.daysAgo - mIndex)),
      };
    });

    const finalAssessment = getFinalAssessment(person.domainId);
    const finalScore = seededInt(`${id}-final-score`, 7, 10);
    progress.push({
      studentId: id,
      domainId: person.domainId,
      completedModules,
      moduleAttempts,
      finalAttempt:
        isComplete && finalAssessment
          ? {
              assessmentId: finalAssessment.id,
              score: finalScore,
              total: 10,
              percentage: finalScore * 10,
              passed: finalScore * 10 >= 70,
              answers: {},
              submittedAt: iso(Math.max(1, person.daysAgo - moduleCount)),
            }
          : null,
      notes: {},
      lastModuleId: completedModules[completedModules.length - 1] ?? null,
      updatedAt: iso(Math.max(0, person.daysAgo - moduleCount)),
    });

    // Practical submission state follows overall progress.
    const submissionStatus: Submission["status"] = isComplete
      ? "approved"
      : person.progress >= 0.6
        ? "reviewed"
        : person.progress >= 0.35
          ? "submitted"
          : "pending";

    submissions.push({
      id: `sub_${id}`,
      studentId: id,
      studentName: person.name,
      domainId: person.domainId,
      taskTitle: domain.practicalTask.title,
      responseText:
        submissionStatus === "pending"
          ? ""
          : `Demo submission for the ${domain.name} practical activity. ${domain.practicalTask.brief}`,
      fileName: submissionStatus === "pending" ? null : `${id}-practical-task.pdf`,
      status: submissionStatus,
      feedback:
        submissionStatus === "approved"
          ? "Clear structure and correct use of terminology. Approved."
          : submissionStatus === "reviewed"
            ? "Reviewed — observations are sound. Add one more supporting detail."
            : null,
      submittedAt:
        submissionStatus === "pending"
          ? null
          : iso(Math.max(1, person.daysAgo - 5)),
      reviewedAt:
        submissionStatus === "approved" || submissionStatus === "reviewed"
          ? iso(Math.max(1, person.daysAgo - 3))
          : null,
    });

    /* ---- V2 career evidence ------------------------------------- */
    // Career artefacts only exist once a student is meaningfully underway,
    // so the readiness score reads as earned rather than granted at signup.
    const briefs = projectsForDomain(person.domainId);
    const coreBrief = briefs.find((b) => b.tier === "core");

    if (coreBrief && person.progress >= 0.4) {
      const evaluated = person.progress >= 0.75;
      const projectScore = seededInt(`proj-${id}`, 62, 94);
      const criterionScores: Record<string, number> = {};
      for (const criterion of coreBrief.evaluationCriteria) {
        criterionScores[criterion.label] = clampScore(
          projectScore + seededInt(`proj-${id}-${criterion.label}`, -9, 9),
        );
      }

      projectSubmissions.push({
        id: `projsub_${id}_core`,
        studentId: id,
        projectId: coreBrief.id,
        domainId: person.domainId,
        status: evaluated ? "evaluated" : "submitted",
        analysis: `Demo analysis for ${coreBrief.title}. ${coreBrief.problemStatement}`,
        recommendations:
          "Prioritise the highest-impact intervention identified in the analysis, then re-measure after one cycle.",
        reportFileName: `${id}-${coreBrief.id}-report.pdf`,
        repoUrl: null,
        criterionScores: evaluated ? criterionScores : {},
        overallScore: evaluated ? projectScore : null,
        feedback: evaluated
          ? "Sound method and a clear recommendation. Tighten the evaluation section."
          : null,
        startedAt: iso(Math.max(2, person.daysAgo - 8)),
        submittedAt: iso(Math.max(1, person.daysAgo - 6)),
        evaluatedAt: evaluated ? iso(Math.max(1, person.daysAgo - 4)) : null,
      });
    }

    if (person.progress >= 0.55) {
      const base = seededInt(`intv-${id}`, 58, 92);
      interviewSessions.push({
        id: `intv_${id}_1`,
        studentId: id,
        kind: person.progress >= 0.8 ? "project" : "hr",
        domainId: person.domainId,
        answers: {},
        scores: {
          clarity: clampScore(base + seededInt(`intv-${id}-c`, -8, 8)),
          structure: clampScore(base + seededInt(`intv-${id}-s`, -10, 6)),
          depth: clampScore(base + seededInt(`intv-${id}-d`, -6, 10)),
        },
        overallScore: base,
        strengths: ["Answers are the right length and easy to follow."],
        improvements: ["Add concrete detail — numbers, decisions, what you actually did."],
        completedAt: iso(Math.max(1, person.daysAgo - 5)),
      });
    }

    if (person.progress >= 0.85) {
      const relevant = challengesForDomain(person.domainId).recommended[0];
      if (relevant) {
        const score = seededInt(`chal-${id}`, 64, 93);
        challengeEntries.push({
          id: `chal_${id}_1`,
          studentId: id,
          challengeId: relevant.id,
          status: "evaluated",
          approach: `Demo approach for ${relevant.title}.`,
          solution: "Submitted solution with stated assumptions and limitations.",
          repoUrl: null,
          score,
          feedback:
            "Strong framing. The limitations section is what lifted this above a pass.",
          submittedAt: iso(Math.max(1, person.daysAgo - 3)),
          evaluatedAt: iso(Math.max(1, person.daysAgo - 2)),
        });
      }

      passports.push({
        studentId: id,
        slug: passportSlug(person.name, index),
        published: true,
        headline: `${domain.shortName} intern · Roystian Foundation`,
        about: `${person.name.split(" ")[0]} completed the ${domain.name} virtual internship, building assessed skills and a structured industry project.`,
        visibility: {
          readiness: true,
          projects: true,
          assessments: true,
          badges: true,
          certificate: true,
          contact: false,
        },
        createdAt: iso(Math.max(1, person.daysAgo - 2)),
        updatedAt: iso(Math.max(1, person.daysAgo - 2)),
      });
    }

    if (isComplete) {
      certificateSeq += seededInt(`cert-${id}`, 11, 60);
      const certificateId =
        FIXED_CERTIFICATE_IDS[person.name] ??
        buildCertificateId(person.domainId, certificateSeq, 2026);
      certificates.push({
        id: certificateId,
        studentId: id,
        studentName: person.name,
        domainId: person.domainId,
        domainName: domain.name,
        programId: person.programId,
        programName:
          person.programId === "industry-led"
            ? "Industry-Led Virtual Internship"
            : "Self-Paced Virtual Internship",
        duration: "15 Days",
        issueDate: iso(Math.max(1, person.daysAgo - moduleCount - 1)),
        status: "valid",
        registrationId,
        finalScore: finalScore * 10,
      });
    }

    communications.push({
      id: `com_${id}_pay`,
      event: "payment-success",
      channel: "email",
      recipient: person.email,
      subject: `Welcome to Roystian Foundation — ${domain.name} Virtual Internship`,
      body: `Your registration ${registrationId} is confirmed. Your dashboard has been activated.`,
      status: "sent",
      createdAt,
    });
    communications.push({
      id: `com_${id}_wa`,
      event: "payment-success",
      channel: "whatsapp",
      recipient: `+91 9${String(800000000 + index * 137911).slice(0, 9)}`,
      subject: "Registration confirmed",
      body: `Hi ${person.name.split(" ")[0]}, your Roystian virtual internship (${domain.shortName}) is confirmed. Registration ID ${registrationId}.`,
      status: "sent",
      createdAt,
    });
    if (isComplete) {
      communications.push({
        id: `com_${id}_cert`,
        event: "program-completed",
        channel: "email",
        recipient: person.email,
        subject: "Your Roystian internship certificate is ready",
        body: "Completion requirements satisfied. Your certificate has been generated and the verification page is live.",
        status: "sent",
        createdAt: iso(Math.max(1, person.daysAgo - moduleCount - 1)),
      });
    }
  });

  // Notifications for the demo student account.
  const demo = students[0];
  const demoDomain = getDomain(demo.domainId);
  notifications.push(
    {
      id: "ntf_001",
      userId: demo.id,
      type: "success",
      title: "Registration confirmed",
      body: `Your ${demoDomain?.name} virtual internship is active. Registration ID ${demo.registrationId}.`,
      createdAt: iso(9),
      read: true,
      href: "/dashboard",
    },
    {
      id: "ntf_002",
      userId: demo.id,
      type: "assessment",
      title: "Module 04 assessment passed",
      body: "You scored 80% on Real-World AI Applications. Module 05 is now unlocked.",
      createdAt: iso(2, 16),
      read: false,
      href: "/dashboard/assessments",
    },
    {
      id: "ntf_003",
      userId: demo.id,
      type: "assignment",
      title: "Practical task is waiting",
      body: "Your practical activity has not been submitted yet. It is required for certificate eligibility.",
      createdAt: iso(1, 9),
      read: false,
      href: "/dashboard/assignments",
    },
    {
      id: "ntf_004",
      userId: demo.id,
      type: "reminder",
      title: "Live session tomorrow",
      body: "Day 08 — Practical Workshop with Aarav Mehta at 18:00 IST.",
      createdAt: iso(0, 8),
      read: false,
      href: "/dashboard/schedule",
    },
  );

  const staff: User[] = [
    {
      id: "adm_001",
      role: "admin",
      name: "Programme Administrator",
      email: "admin@roystian.demo",
      password: "admin123",
      avatarColor: "indigo",
      createdAt: iso(120),
      isDemoSeed: true,
    },
    {
      id: "trn_001",
      role: "trainer",
      name: "Aarav Mehta",
      email: "trainer@roystian.demo",
      password: "trainer123",
      avatarColor: "violet",
      createdAt: iso(110),
      isDemoSeed: true,
    },
    {
      // Placement-cell login for the Roystian Campus Dashboard. The account id
      // matches a seeded college so the dashboard can resolve its cohort.
      id: "college_vjit",
      role: "college",
      name: "Vignan Institute of Technology",
      email: "college@roystian.demo",
      password: "college123",
      avatarColor: "teal",
      createdAt: iso(100),
      isDemoSeed: true,
    },
    {
      id: "ptn_001",
      role: "partner",
      name: "Roystian Advanced Technologies",
      email: "partner@roystian.demo",
      password: "partner123",
      avatarColor: "amber",
      createdAt: iso(95),
      isDemoSeed: true,
    },
  ];

  const leads: CollegeLead[] = [
    {
      id: "lead_001",
      collegeName: "Sinhgad College of Engineering",
      city: "Pune",
      state: "Maharashtra",
      institutionType: "engineering",
      departments: "CSE, IT",
      yearBatch: "3rd Year",
      contactPerson: "Dr. S. Kulkarni",
      designation: "Training & Placement Officer",
      email: "tpo@demo-sinhgad.edu",
      phone: "+91 90000 11111",
      studentCount: "200–500",
      interest: "Internship Drives",
      message:
        "Looking to run a batch internship drive for third-year computer and IT students in the coming semester.",
      status: "contacted",
      createdAt: iso(12),
    },
    {
      id: "lead_002",
      collegeName: "Christ University",
      city: "Bengaluru",
      state: "Karnataka",
      institutionType: "university",
      departments: "Commerce, Management",
      yearBatch: "Mixed / Multiple batches",
      contactPerson: "Prof. A. Thomas",
      designation: "Head of Placements",
      email: "placements@demo-christ.edu",
      phone: "+91 90000 22222",
      studentCount: "500+",
      interest: "Employability Programs",
      message: "Interested in a semester-long employability programme for commerce students.",
      status: "new",
      createdAt: iso(4),
    },
    {
      id: "lead_003",
      collegeName: "Government Polytechnic Thrissur",
      city: "Thrissur",
      state: "Kerala",
      institutionType: "training",
      departments: "Electronics, Mechanical",
      yearBatch: "Final Year",
      contactPerson: "Mr. R. Menon",
      designation: "Principal",
      email: "principal@demo-gpt.edu",
      phone: "+91 90000 33333",
      studentCount: "50–200",
      interest: "Technology Workshops",
      message: "Two-day workshop on IoT for diploma students.",
      status: "scheduled",
      createdAt: iso(20),
    },
  ];

  communications.push({
    id: "com_reminder_batch",
    event: "program-approaching",
    channel: "whatsapp",
    recipient: "Active cohort · 14 students",
    subject: "Programme reminder",
    body: "Your internship completion window closes in 5 days. Finish remaining modules and the practical task.",
    status: "queued",
    createdAt: futureIso(1, 9),
  });

  return {
    version: DB_VERSION,
    seededAt: new Date().toISOString(),
    students,
    staff,
    registrations,
    payments,
    certificates,
    submissions,
    progress,
    notifications,
    leads,
    communications,
    projectSubmissions,
    interviews: interviewSessions,
    challengeEntries,
    passports,
    resumes: [],
    linkedInDrafts: [],
    fellowshipApplications: [],
    scholarshipApplications: [],
    colleges,
    programOverrides: {},
    domainOverrides: {},
    trainerOverrides: {},
    customPrograms: [],
    customTrainers: [],
    counters: {
      registration: registrationSeq,
      certificate: certificateSeq,
      payment: paymentSeq,
    },
  };
}

export const SEED_DOMAIN_COUNT = DOMAINS.length;
