import { getDomain } from "@/data/domains";
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/data/content";
import type { Domain, EducationLevel, ExperienceLevel } from "@/types";

export interface RecommendedTrack {
  domain: Domain;
  trackName: string;
  difficulty: string;
  effort: string;
  moduleCount: number;
  assessmentStyle: string;
  practicalActivity: string;
  educationLabel: string;
  experienceLabel: string;
  rationale: string;
}

const ASSESSMENT_STYLE: Record<ExperienceLevel, string> = {
  beginner:
    "Concept-recall assessments after every module, plus a 10-question final assessment.",
  intermediate:
    "Concept and applied assessments after every module, plus a 10-question final assessment.",
  advanced:
    "Applied and scenario-based assessments after every module, plus a 10-question final assessment.",
};

const EDUCATION_NOTE: Record<EducationLevel, string> = {
  intermediate: "builds the vocabulary first so nothing is assumed",
  diploma: "connects your practical training to industry framing",
  undergraduate: "maps directly onto what campus interviews expect",
  postgraduate: "moves quickly through fundamentals into application",
  "working-professional": "focuses on applied decisions rather than theory",
};

export function buildRecommendation(
  domainId: string | null | undefined,
  experience: ExperienceLevel | null | undefined,
  education: EducationLevel | "" | null | undefined,
): RecommendedTrack | null {
  const domain = getDomain(domainId);
  if (!domain || !experience) return null;

  const experienceMeta =
    EXPERIENCE_LEVELS.find((e) => e.value === experience) ?? EXPERIENCE_LEVELS[0];
  const educationMeta = EDUCATION_LEVELS.find((e) => e.value === education);

  return {
    domain,
    trackName: `${domain.shortName} ${experienceMeta.label.split(" / ")[0]} Track`,
    difficulty: experienceMeta.difficulty,
    effort: experienceMeta.effort,
    moduleCount: domain.modules.length,
    assessmentStyle: ASSESSMENT_STYLE[experience],
    practicalActivity: domain.practicalTask.brief,
    educationLabel: educationMeta?.label ?? "Student",
    experienceLabel: experienceMeta.label,
    rationale: education
      ? `Chosen because this track ${EDUCATION_NOTE[education as EducationLevel]} and starts at the ${experienceMeta.label.toLowerCase()} level you selected.`
      : `Chosen to start at the ${experienceMeta.label.toLowerCase()} level you selected.`,
  };
}
