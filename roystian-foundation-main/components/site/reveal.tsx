"use client";

/**
 * Kept as the site-wide import path for scroll reveals. The implementation now
 * lives in the shared motion system so marketing pages, the dashboard and the
 * admin console all animate with the same curve and timing.
 */
export { Reveal, Stagger } from "@/components/motion/reveal";
export type { RevealProps, StaggerProps } from "@/components/motion/reveal";
