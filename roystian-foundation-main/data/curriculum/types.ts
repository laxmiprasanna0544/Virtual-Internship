import type { ExperienceLevel, PracticalTask } from "@/types";

/** Compact authoring format for module content. */
export interface RawModule {
  /** Module title */
  t: string;
  /** One-line summary */
  s: string;
  /** Learning objectives */
  o: string[];
  /** Key concepts written as "Term|Definition" */
  c: string[];
}

export interface RawDomain {
  id: string;
  name: string;
  shortName: string;
  code: string;
  icon: string;
  category: "Technology" | "Data" | "Business" | "Engineering" | "Impact";
  tagline: string;
  description: string;
  longDescription: string;
  whoFor: string[];
  whatYouLearn: string[];
  levels: ExperienceLevel[];
  curriculumSource: "documented" | "demo";
  practicalTask: PracticalTask;
  modules: RawModule[];
}
