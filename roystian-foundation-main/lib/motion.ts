import type { Transition, Variants } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Motion design system                                               */
/*                                                                     */
/*  One easing curve, four duration bands and a small set of named      */
/*  variants. Every animated surface on the site draws from here so     */
/*  motion reads as one system rather than a pile of one-off tweens.    */
/* ------------------------------------------------------------------ */

/** Decelerating curve — fast to start, settles without overshoot. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Symmetrical curve for state changes that reverse (hover, toggle). */
export const EASE_INOUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const DURATION = {
  /** Hover, press, focus — must feel instant. */
  micro: 0.2,
  /** A single component entering or changing state. */
  component: 0.45,
  /** A section revealing on scroll. */
  section: 0.7,
  /** The hero, once, on first paint. */
  hero: 1,
} as const;

export const STAGGER = {
  tight: 0.06,
  default: 0.09,
  loose: 0.12,
} as const;

export const transition = (
  duration: number = DURATION.component,
  delay = 0,
): Transition => ({ duration, delay, ease: EASE });

/** Viewport config for scroll reveals — fire once, slightly before entry. */
export const VIEWPORT = { once: true, margin: "-80px 0px -80px 0px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: transition(DURATION.section) },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition(DURATION.section) },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transition(DURATION.component) },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: transition(DURATION.section) },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: transition(DURATION.section) },
};

/** Photography settles from a slight overscale so it never pops into place. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: EASE },
  },
};

export const staggerChildren = (
  stagger: number = STAGGER.default,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Word-by-word headline reveal used in the hero and section openers. */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE },
  },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: EASE } },
};

/** Variants collapsed to a no-op, for `prefers-reduced-motion`. */
export const still: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

export type MotionPreset =
  | "fadeUp"
  | "fadeIn"
  | "scaleIn"
  | "slideLeft"
  | "slideRight"
  | "imageReveal";

export const PRESETS: Record<MotionPreset, Variants> = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideLeft,
  slideRight,
  imageReveal,
};
