import type { BadgeId, SkillBadge } from "@/types";

/**
 * Skill badges.
 *
 * The PRD is explicit that badges must connect to actual assessments,
 * projects or activities and are never awarded automatically. The criteria
 * string below is the user-facing promise; `lib/badges.ts` holds the matching
 * rule that evaluates it against real progress data. If you change one,
 * change the other.
 *
 * The three domain-specific badges in the deck (Python Fundamentals, Data
 * Analysis, Machine Learning) are generalised here into badges that work
 * across all twelve domains — a Mechanical student should be able to earn a
 * fundamentals badge too. The domain name is substituted at render time.
 */
export const BADGES: SkillBadge[] = [
  {
    id: "domain-fundamentals",
    name: "Fundamentals",
    icon: "BookOpenCheck",
    description:
      "Core concepts of your domain, demonstrated under assessment rather than claimed.",
    criteria:
      "Pass the first five module assessments, averaging 75% or above.",
  },
  {
    id: "data-analysis",
    name: "Analysis",
    icon: "LineChart",
    description:
      "The ability to read evidence and draw a defensible conclusion from it.",
    criteria:
      "Submit a project whose analysis section is marked at 70% or above.",
  },
  {
    id: "applied-practice",
    name: "Applied Practice",
    icon: "Wrench",
    description: "Concepts carried from reading into hands-on work.",
    criteria:
      "Have your practical activity reviewed or approved by a trainer.",
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    icon: "Lightbulb",
    description: "Reasoning through an unfamiliar problem to a working answer.",
    criteria: "Pass the final assessment at 80% or above.",
  },
  {
    id: "project-execution",
    name: "Project Execution",
    icon: "FolderCheck",
    description:
      "Taking a brief from problem statement to finished, evaluated work.",
    criteria: "Have a project evaluated at 70% or above.",
  },
  {
    id: "industry-challenge",
    name: "Industry Challenge",
    icon: "Trophy",
    description:
      "Solving a real, open-ended problem outside the structured curriculum.",
    criteria: "Score 70% or above on any Roystian Industry Challenge.",
  },
  {
    id: "career-ready",
    name: "Career Ready",
    icon: "BadgeCheck",
    description:
      "Evidence across every readiness area, with a complete Career Passport.",
    criteria:
      "Reach a Career Readiness Score of 75 with evidence in all five areas.",
  },
];

export function getBadge(id: BadgeId): SkillBadge | undefined {
  return BADGES.find((b) => b.id === id);
}
