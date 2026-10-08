"use client";

import * as React from "react";
import {
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  type MotionValue,
} from "framer-motion";

/**
 * Scroll progress for a timeline line, clamped so it only ever moves forward.
 *
 * A stage that has already activated stays activated, so scrolling back up
 * does not visually "un-complete" the journey the reader just watched fill in.
 */
export function useProgressLine(ref: React.RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 72%", "end 62%"],
  });
  const furthest = useMotionValue(0.001);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (value > furthest.get()) furthest.set(value);
  });

  return useSpring(furthest, { stiffness: 90, damping: 28, mass: 0.4 });
}
