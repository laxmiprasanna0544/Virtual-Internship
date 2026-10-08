import type { Trainer } from "@/types";

/**
 * Demo trainer profiles. These are illustrative personas created for the demo
 * environment — they are not real individuals and carry no real credentials.
 */
export const TRAINERS: Trainer[] = [
  {
    id: "trainer-aarav-mehta",
    name: "Aarav Mehta",
    role: "Senior AI Engineer",
    industry: "Technology",
    experience: "8+ years",
    specialization: "AI/ML & Data Systems",
    linkedin: "https://www.linkedin.com/in/demo-aarav-mehta",
    bio: "Works on applied machine learning systems and mentors the AI/ML and Data Analytics tracks. Demo profile created for this environment.",
    domains: ["ai-ml", "data-analytics", "software-development"],
    initials: "AM",
    accent: "indigo",
    active: true,
  },
  {
    id: "trainer-kavya-nair",
    name: "Kavya Nair",
    role: "Lead Data Analyst",
    industry: "Consumer Internet",
    experience: "7+ years",
    specialization: "Analytics, dashboards & experimentation",
    linkedin: "https://www.linkedin.com/in/demo-kavya-nair",
    bio: "Builds analytics practice and reporting standards for product teams. Demo profile created for this environment.",
    domains: ["data-analytics", "business-analytics"],
    initials: "KN",
    accent: "teal",
    active: true,
  },
  {
    id: "trainer-rohan-desai",
    name: "Rohan Desai",
    role: "Principal Software Engineer",
    industry: "Technology",
    experience: "10+ years",
    specialization: "Full stack systems & platform engineering",
    linkedin: "https://www.linkedin.com/in/demo-rohan-desai",
    bio: "Leads platform engineering teams and mentors developers on system design. Demo profile created for this environment.",
    domains: ["full-stack-development", "java-development", "software-development"],
    initials: "RD",
    accent: "violet",
    active: true,
  },
  {
    id: "trainer-sneha-iyer",
    name: "Sneha Iyer",
    role: "QA Engineering Manager",
    industry: "Enterprise Software",
    experience: "9+ years",
    specialization: "Test strategy & automation",
    linkedin: "https://www.linkedin.com/in/demo-sneha-iyer",
    bio: "Runs quality engineering for enterprise products and coaches testers on automation strategy. Demo profile created for this environment.",
    domains: ["software-testing", "python-development"],
    initials: "SI",
    accent: "amber",
    active: true,
  },
  {
    id: "trainer-vikram-rao",
    name: "Vikram Rao",
    role: "Embedded Systems Architect",
    industry: "Industrial IoT",
    experience: "12+ years",
    specialization: "IoT devices, firmware & connectivity",
    linkedin: "https://www.linkedin.com/in/demo-vikram-rao",
    bio: "Designs connected industrial hardware and firmware platforms. Demo profile created for this environment.",
    domains: ["iot-electronics", "mechanical-engineering"],
    initials: "VR",
    accent: "sky",
    active: true,
  },
  {
    id: "trainer-meera-joshi",
    name: "Meera Joshi",
    role: "Sustainability Consultant",
    industry: "Climate & ESG Advisory",
    experience: "8+ years",
    specialization: "Carbon accounting & ESG reporting",
    linkedin: "https://www.linkedin.com/in/demo-meera-joshi",
    bio: "Advises organisations on emissions measurement and sustainability reporting. Demo profile created for this environment.",
    domains: ["sustainability"],
    initials: "MJ",
    accent: "emerald",
    active: true,
  },
  {
    id: "trainer-aditya-kulkarni",
    name: "Aditya Kulkarni",
    role: "Growth & Marketing Lead",
    industry: "Consumer Brands",
    experience: "9+ years",
    specialization: "Campaign strategy & performance marketing",
    linkedin: "https://www.linkedin.com/in/demo-aditya-kulkarni",
    bio: "Builds go-to-market and growth programmes for consumer brands. Demo profile created for this environment.",
    domains: ["sales-marketing", "business-analytics"],
    initials: "AK",
    accent: "rose",
    active: true,
  },
];

const trainerIndex = new Map(TRAINERS.map((t) => [t.id, t]));

export function getTrainer(id: string | null | undefined): Trainer | undefined {
  if (!id) return undefined;
  return trainerIndex.get(id);
}

export function getTrainerForDomain(domainId: string | null | undefined): Trainer {
  const match = TRAINERS.find((t) => domainId && t.domains.includes(domainId));
  return match ?? TRAINERS[0];
}
