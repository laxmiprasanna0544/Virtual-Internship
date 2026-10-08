import type { Program, ProgramFeature, ProgramId } from "@/types";

export const PROGRAMS: Program[] = [
  {
    id: "self-paced",
    name: "Self-Paced Virtual Internship",
    marketingName: "Career Starter",
    promise: "For flexible learning and practical exposure.",
    price: 1500,
    durationLabel: "15 Days · flexible",
    tagline: "Learn on your own schedule, with the same completion standard.",
    description:
      "A structured, reading-led virtual internship you complete independently. All module material, resources, assessments and the practical activity are available from day one, and the certificate unlocks once the completion requirements are met.",
    bestFor: "Students who prefer flexible, self-paced learning.",
    features: [
      "Structured domain learning content",
      "Learning resources and reference material",
      "Module assessments",
      "Practical activities",
      "Final assessment",
      "Internship completion certificate",
      "Online certificate verification",
    ],
    // Self-Paced is a reading and practice track. It carries no video lessons,
    // no live sessions and no mentor contact — that is what Industry-Led adds.
    excludes: [
      "Video lessons",
      "Live professional sessions",
      "Mentor interaction",
      "Guided project",
      "Career guidance",
      "PehlaChance subscription",
    ],
    certificateEnabled: true,
    pehlaChanceIncluded: false,
    liveSessions: false,
    active: true,
  },
  {
    id: "industry-led",
    name: "Industry-Led Virtual Internship",
    marketingName: "Industry Sprint",
    promise:
      "For students seeking deeper practical experience, mentorship and career preparation.",
    price: 5000,
    durationLabel: "15 Days · structured",
    tagline: "A guided 15-day programme with working professionals.",
    description:
      "Everything in the self-paced track, delivered alongside a structured 15-day schedule with live sessions led by working professionals, mentor interaction, guided assignments and career guidance.",
    bestFor: "Students who want live guidance and structured learning.",
    features: [
      "Everything in Self-Paced",
      "15-day structured live program",
      "Sessions with working professionals",
      "Mentor interaction and live Q&A",
      "Guided practical assignments",
      "Guided project",
      "Career guidance",
      "Internship completion certificate (generated only after completion of live classes across the 15-day duration)",
      "1-month FREE PehlaChance subscription",
    ],
    excludes: [],
    certificateEnabled: true,
    pehlaChanceIncluded: true,
    liveSessions: true,
    active: true,
  },
];

export const PROGRAM_FEATURES: ProgramFeature[] = [
  {
    label: "Structured learning content",
    detail: "Written module material, concepts and objectives for your domain.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Learning resources",
    detail: "Handbooks, worksheets, checklists and reference material per module.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Module assessments",
    detail: "A short assessment after every module, 70% to pass, unlimited retakes.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Practical activities",
    detail: "A domain practical task submitted for review.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Final assessment",
    detail: "The closing assessment across the whole track.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Internship completion certificate",
    detail: "Issued once all completion requirements are met. In the guided programme, the certificate will be generated only after the completion of live classes, that is the duration period mentioned which is 15 days.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Online certificate verification",
    detail: "A public verification page and QR code for every certificate.",
    selfPaced: true,
    industryLed: true,
  },
  {
    label: "Video lessons",
    detail: "Recorded lessons are part of the live Industry-Led programme only.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "15-day structured live programme",
    detail: "A fixed daily schedule across fifteen days.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "Live professional sessions",
    detail: "Sessions run by people doing the work today.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "Mentor interaction and live Q&A",
    detail: "Ask questions and get answers during the programme.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "Guided project",
    detail: "Project work built with guidance and review cycles.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "Career guidance",
    detail: "Role mapping, profile guidance and next steps.",
    selfPaced: false,
    industryLed: true,
  },
  {
    label: "PehlaChance 1-month access",
    detail: "One month of PehlaChance at no additional cost.",
    selfPaced: false,
    industryLed: true,
  },
];

const programIndex = new Map(PROGRAMS.map((p) => [p.id, p]));

export function getProgram(id: ProgramId | null | undefined): Program | undefined {
  if (!id) return undefined;
  return programIndex.get(id);
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
