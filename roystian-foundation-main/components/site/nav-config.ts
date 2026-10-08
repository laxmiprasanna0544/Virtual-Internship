/**
 * Main navigation, V2.
 *
 * The site grew from an internship brochure into a platform with four
 * audiences, so the flat link bar no longer holds. Each group below is one
 * audience's entry point; `href` on the group is where the group label itself
 * leads, and children are the surfaces inside it.
 *
 * The navbar and the footer both read this, so a route added here appears in
 * both without a second edit.
 */
export interface NavChild {
  href: string;
  label: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href: string;
  children?: NavChild[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Internships",
    href: "/internships",
    children: [
      {
        href: "/programs#self-paced",
        label: "Self-Paced",
        description: "Career Starter — ₹1,500",
      },
      {
        href: "/programs#industry-led",
        label: "Industry-Led",
        description: "Industry Sprint — ₹5,000",
      },
      {
        href: "/domains",
        label: "Career Domains",
        description: "12 tracks across three clusters",
      },
      {
        href: "/how-it-works",
        label: "How It Works",
        description: "The journey from learning to opportunity",
      },
    ],
  },
  {
    label: "For Students",
    href: "/for-students",
    children: [
      {
        href: "/for-students#passport",
        label: "Career Passport",
        description: "Your career evidence in one place",
      },
      {
        href: "/for-students#projects",
        label: "Projects",
        description: "Industry-style briefs with real evaluation",
      },
      {
        href: "/for-students#assessments",
        label: "Assessments",
        description: "Module and final assessments",
      },
      {
        href: "/for-students#readiness",
        label: "Career Readiness",
        description: "Measured across five areas",
      },
      {
        href: "/for-students#resume",
        label: "Resume & LinkedIn",
        description: "Turn your work into a professional profile",
      },
      {
        href: "/for-students#interview",
        label: "Mock Interviews",
        description: "Technical, HR and project practice",
      },
    ],
  },
  {
    label: "For Colleges",
    href: "/colleges",
    children: [
      {
        href: "/colleges#programs",
        label: "Programs",
        description: "Campus internships and skill tracks",
      },
      {
        href: "/colleges#dashboard",
        label: "Campus Dashboard",
        description: "Live cohort progress and readiness",
      },
      {
        href: "/colleges#skill-gap",
        label: "Skill Gap Reports",
        description: "Where your cohort is strong and weak",
      },
      {
        href: "/colleges#partner",
        label: "Request a Demo",
        description: "Start an institutional conversation",
      },
    ],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    children: [
      {
        href: "/opportunities/fellowship",
        label: "Talent Fellowship",
        description: "An advanced pathway for high performers",
      },
      {
        href: "/opportunities/challenges",
        label: "Industry Challenges",
        description: "Six open-ended problems to solve",
      },
      {
        href: "/opportunities/advanced-internship",
        label: "Advanced Internships",
        description: "3-month paid offline internship pathway",
      },
      {
        href: "/opportunities/scholarship",
        label: "Skill Scholarship",
        description: "Support so cost is not the barrier",
      },
      {
        href: "/pehlachance",
        label: "PehlaChance",
        description: "Discover internships and early roles",
      },
    ],
  },
  {
    label: "About",
    href: "/about",
    children: [
      {
        href: "/about",
        label: "The Foundation",
        description: "Section 8 non-profit, six focus areas",
      },
      {
        href: "/about#impact",
        label: "Impact",
        description: "What the platform has produced so far",
      },
      {
        href: "/verify",
        label: "Verify a Certificate",
        description: "Check any Roystian credential",
      },
    ],
  },
];

/** Flat list of every navigable route, used by the footer sitemap. */
export const FOOTER_GROUPS = NAV_GROUPS.map((group) => ({
  label: group.label,
  links: group.children ?? [{ href: group.href, label: group.label }],
}));
