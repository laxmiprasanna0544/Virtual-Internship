/**
 * The registration funnel's step list.
 *
 * Kept out of `lib/onboarding.ts` because that module is a client store, and
 * anything exported across a "use client" boundary becomes a client reference
 * when a server component imports it. `StartShell` is a server component and
 * reads `.length` from this list — through the client boundary that silently
 * evaluated to 0, which is why every step of the funnel rendered "STEP n / 0".
 *
 * Static content that server components need lives here; the client store
 * re-exports it so existing client callers keep one import site.
 */
export interface OnboardingStep {
  step: string;
  label: string;
  href: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { step: "01", label: "Profile", href: "/start" },
  { step: "02", label: "Domain", href: "/start/domain" },
  { step: "03", label: "Experience", href: "/start/experience" },
  { step: "04", label: "Program", href: "/start/program" },
  { step: "05", label: "Registration", href: "/checkout" },
  { step: "06", label: "Payment", href: "/checkout" },
  { step: "07", label: "Dashboard", href: "/dashboard" },
];
