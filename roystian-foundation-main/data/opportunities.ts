import type { FellowshipStage, ScholarshipTier } from "@/types";

/**
 * Static opportunity content.
 *
 * Kept out of `lib/opportunities.ts` because that module is a client store —
 * anything exported across a "use client" boundary becomes a client reference
 * and cannot be read during a server render. These constants are used by
 * server-rendered marketing pages, so they live here.
 */

/** Areas named in the PRD for the Hyderabad offline internship. */
export const FELLOWSHIP_AREAS = [
  "AI & Technology",
  "Software Development",
  "Automation",
  "Sustainability",
  "Research & Innovation",
  "Business Operations",
];

export const FELLOWSHIP_STAGE_LABEL: Record<FellowshipStage, string> = {
  "not-eligible": "Not yet eligible",
  eligible: "Eligible to apply",
  applied: "Application received",
  shortlisted: "Shortlisted",
  interview: "Interview stage",
  selected: "Selected",
  "not-selected": "Not selected this cycle",
};

/**
 * The readiness floor for a fellowship application. Nothing here promises
 * selection — it is only the gate on being allowed to apply.
 */
export const FELLOWSHIP_READINESS_FLOOR = 70;

export const SCHOLARSHIP_TIERS: {
  tier: ScholarshipTier;
  label: string;
  blurb: string;
}[] = [
  {
    tier: 100,
    label: "100% Support",
    blurb: "Full scholarship for eligible students.",
  },
  { tier: 75, label: "75% Support", blurb: "Partial scholarship tier." },
  { tier: 50, label: "50% Support", blurb: "Partial scholarship tier." },
];

export const INCOME_BANDS = [
  "Under ₹1,50,000",
  "₹1,50,000 – ₹3,00,000",
  "₹3,00,000 – ₹5,00,000",
  "₹5,00,000 – ₹8,00,000",
  "Above ₹8,00,000",
];

export const SCHOLARSHIP_CATEGORIES = [
  "General",
  "OBC",
  "SC",
  "ST",
  "EWS",
  "Prefer not to say",
];
