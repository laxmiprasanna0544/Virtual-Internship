"use client";

import {
  notifyChange,
  readStorage,
  removeStorage,
  STORAGE_KEYS,
  writeStorage,
} from "@/lib/storage";
import type { OnboardingDraft } from "@/types";

export const EMPTY_DRAFT: OnboardingDraft = {
  fullName: "",
  email: "",
  mobile: "",
  educationLevel: "",
  college: "",
  course: "",
  city: "",
  domainId: null,
  experience: null,
  programId: null,
};

export function getDraft(): OnboardingDraft {
  return readStorage<OnboardingDraft>(STORAGE_KEYS.onboarding, EMPTY_DRAFT);
}

export function saveDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = { ...getDraft(), ...patch };
  writeStorage(STORAGE_KEYS.onboarding, next);
  notifyChange();
  return next;
}

export function clearDraft(): void {
  removeStorage(STORAGE_KEYS.onboarding);
  notifyChange();
}

/* Re-exported so client callers keep a single import site. */
export { ONBOARDING_STEPS } from "@/data/onboarding-steps";
export type { OnboardingStep } from "@/data/onboarding-steps";
