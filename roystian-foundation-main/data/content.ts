import type { EducationLevel, ExperienceLevel } from "@/types";

export const SITE = {
  name: "Roystian Foundation",
  shortName: "Roystian",
  product: "Virtual Internship & Skill Development Platform",
  tagline: "Learn. Build. Get Certified. Move Forward.",
  description:
    "Build practical skills through structured virtual internships, assessments, practical activities and verifiable certificates.",
  email: "hello@roystian.demo",
  phone: "+91 90000 00000",
  address: {
    line1: "T-Hub Phase 2",
    line2: "Knowledge City, Raidurg",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500081",
    country: "India",
    /** Single-line form for meta tags and compact contexts. */
    full: "T-Hub Phase 2, Knowledge City, Raidurg, Hyderabad, Telangana 500081, India",
  },
} as const;

export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: "intermediate", label: "Intermediate" },
  { value: "diploma", label: "Diploma" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "working-professional", label: "Working Professional" },
];

export const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  label: string;
  description: string;
  effort: string;
  difficulty: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Little or no prior experience.",
    effort: "6–8 hours per week",
    difficulty: "Foundational",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Studied the subject and understand the basics.",
    effort: "8–10 hours per week",
    difficulty: "Applied",
  },
  {
    value: "advanced",
    label: "Advanced / Experienced",
    description: "Practical or project experience.",
    effort: "10–12 hours per week",
    difficulty: "Advanced",
  },
];

export const JOURNEY_STAGES = [
  {
    title: "College",
    description: "You arrive with academic knowledge and a degree in progress.",
  },
  {
    title: "Skills",
    description: "You choose a domain and build the underlying concepts properly.",
  },
  {
    title: "Practical Experience",
    description: "You apply those concepts to activities modelled on real work.",
  },
  {
    title: "Internship",
    description: "You complete a structured virtual internship end to end.",
  },
  {
    title: "Certification",
    description: "You earn a verifiable completion certificate once requirements are met.",
  },
  {
    title: "Career Opportunities",
    description: "You move forward with evidence of what you can actually do.",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose a Domain",
    description: "Select your field and experience level.",
    detail:
      "Twelve domains across technology, data, business, engineering and impact. Pick the level that matches where you actually are, not where you wish you were.",
  },
  {
    step: "02",
    title: "Learn & Practice",
    description:
      "Structured learning material, resources, assessments and practical activities.",
    detail:
      "Each module pairs written learning material with key concepts, downloadable resources and a short assessment you can retake.",
  },
  {
    step: "03",
    title: "Get Certified",
    description:
      "Complete requirements and earn a verifiable internship certificate.",
    detail:
      "The certificate unlocks only after the modules, assessments, final assessment and practical task are complete.",
  },
  {
    step: "04",
    title: "Move Forward",
    description: "Build confidence, skills and career readiness.",
    detail:
      "You finish with a completed track, a reviewed practical submission and a certificate anyone can verify online.",
  },
];

export const ABOUT_PILLARS = [
  {
    title: "Artificial Intelligence",
    icon: "BrainCircuit",
    body: "Applied work on intelligent systems, and education programmes that make AI concepts accessible to students outside elite institutions.",
  },
  {
    title: "Deep Technology",
    icon: "Cpu",
    body: "Engineering-led projects across connected devices, systems and software infrastructure that address practical problems.",
  },
  {
    title: "Sustainability",
    icon: "Leaf",
    body: "Research and programmes focused on environmental measurement, resource efficiency and structured interventions.",
  },
  {
    title: "Career Development",
    icon: "Compass",
    body: "Virtual internships, skill programmes and employability support that bridge academic learning and industry expectation.",
  },
  {
    title: "Research & Innovation",
    icon: "FlaskConical",
    body: "Exploratory work and structured studies that feed directly back into what and how we teach.",
  },
  {
    title: "Community Impact",
    icon: "Users",
    body: "Programmes delivered with colleges and community organisations so access is not limited by geography or background.",
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the Roystian virtual internship?",
    a: "It is a structured virtual internship you complete online. You choose a domain and an experience level, work through the module material and resources, complete module assessments and a practical activity, pass a final assessment, and earn a completion certificate that can be verified online.",
  },
  {
    q: "Who can join?",
    a: "Students at intermediate, diploma, undergraduate and postgraduate level, as well as working professionals. No prior experience is required for the beginner level of any domain.",
  },
  {
    q: "What domains are available?",
    a: "Twelve domains: AI/ML, Data Analytics, Business Analytics, Full Stack Development, Software Testing, Python Development, Java Development, IoT & Electronics, Sustainability, Sales & Marketing, Mechanical & Engineering, and Software Development.",
  },
  {
    q: "What is the difference between Self-Paced and Industry-Led?",
    a: "Self-Paced (₹1,500) is a reading and practice track: structured learning content, resources, module assessments, a practical activity, the final assessment and the certificate, on a flexible schedule. It does not include video lessons, live sessions, mentor interaction, a guided project, career guidance or PehlaChance. Industry-Led (₹5,000) adds all of those on a 15-day structured schedule.",
  },
  {
    q: "Does the ₹1,500 Self-Paced programme include video lessons?",
    a: "No. Self-Paced is content based. You get structured written learning material, downloadable resources, module assessments, practical activities, the final assessment and the verifiable certificate. Video lessons, live professional sessions, mentor interaction, the guided project and career guidance are part of the ₹5,000 Industry-Led programme.",
  },
  {
    q: "How does certification work?",
    a: "The certificate is not issued on payment. It unlocks only after you complete the learning modules, pass the module assessments, submit the practical task for review and pass the final assessment at 70% or above.",
  },
  {
    q: "Is the certificate verifiable?",
    a: "Yes. Every certificate carries a unique certificate ID and a QR code linking to a public verification page. Anyone can confirm the name, domain, programme and issue date without logging in.",
  },
  {
    q: "When do I receive the certificate?",
    a: "As soon as all completion requirements are satisfied, the certificate becomes available in your dashboard for download and printing, and the public verification page becomes active.",
  },
  {
    q: "Is placement guaranteed?",
    a: "No. No guaranteed placement is promised. The programme is designed to build practical skills, a completed body of work and a verifiable credential. Hiring outcomes depend on many factors outside any training programme.",
  },
  {
    q: "What is included in the ₹5,000 program?",
    a: "Everything in the self-paced track, plus a 15-day structured live programme, sessions with working professionals, guided project and practical assignments, career guidance and a one-month free PehlaChance subscription.",
  },
  {
    q: "How does the practical task work?",
    a: "Each domain has a practical activity tied to real work — analysing a dataset, designing test cases, building a component, planning a campaign, and so on. You submit a written response or upload a file, and it moves through submitted and reviewed states before the certificate requirement is satisfied.",
  },
];

export const COLLEGE_OFFERINGS = [
  {
    id: "internship-drives",
    title: "Internship Drives",
    icon: "Rocket",
    body: "On-campus and virtual drives that let an entire batch start a structured internship in the same window, with a single point of coordination.",
    points: [
      "Batch onboarding across all twelve domains",
      "Shared start dates and progress reporting",
      "Dedicated coordination for your placement cell",
    ],
  },
  {
    id: "workshops",
    title: "Technology Workshops",
    icon: "Presentation",
    body: "Short, hands-on workshops delivered for a department or a full batch on a specific technology or method.",
    points: [
      "Half-day and full-day formats",
      "Practical activities rather than lecture-only sessions",
      "Delivered online or on campus",
    ],
  },
  {
    id: "career-sessions",
    title: "Career & Employability Sessions",
    icon: "Compass",
    body: "Sessions that help students understand how their subject maps to real roles, and what they are expected to be able to do.",
    points: [
      "Role-mapping by branch and interest",
      "Portfolio and profile guidance",
      "Interview preparation fundamentals",
    ],
  },
  {
    id: "employability",
    title: "Employability Programs",
    icon: "GraduationCap",
    body: "Longer structured programmes combining domain skills, practical work and assessment across a semester.",
    points: [
      "Semester-length structure",
      "Progress visibility for faculty",
      "Verifiable completion credentials per student",
    ],
  },
];

export const FIFTEEN_DAY_PHASES = [
  {
    label: "Days 01–03",
    title: "Foundation",
    description: "Core concepts, vocabulary and the shape of the domain.",
  },
  {
    label: "Days 04–07",
    title: "Tools & Concepts",
    description: "The methods and tools practitioners actually use day to day.",
  },
  {
    label: "Days 08–11",
    title: "Practical Learning",
    description: "Guided application, workshops and the practical activity.",
  },
  {
    label: "Days 12–14",
    title: "Application",
    description: "Project work, review cycles and career guidance.",
  },
  {
    label: "Day 15",
    title: "Completion",
    description: "Final assessment, evaluation and certificate release.",
  },
];
