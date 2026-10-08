"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DURATION,
  PRESETS,
  STAGGER,
  VIEWPORT,
  staggerChildren,
  transition,
  type MotionPreset,
} from "@/lib/motion";

type Tag = "div" | "section" | "li" | "ul" | "article" | "span" | "p";

export interface RevealProps {
  children: React.ReactNode;
  /** Which motion preset to play. Defaults to `fadeUp`. */
  preset?: MotionPreset;
  delay?: number;
  duration?: number;
  className?: string;
  as?: Tag;
  /** Set when the element is inside a <Stagger> and should follow its timing. */
  child?: boolean;
  id?: string;
}

/**
 * Scroll-triggered entrance. Plays once, respects `prefers-reduced-motion`,
 * and animates only opacity/transform so it stays on the compositor.
 */
export function Reveal({
  children,
  preset = "fadeUp",
  delay = 0,
  duration,
  className,
  as = "div",
  child = false,
  id,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as React.ComponentType<HTMLMotionProps<"div">>;

  if (reduce) {
    return (
      <MotionTag id={id} className={cn(className)}>
        {children}
      </MotionTag>
    );
  }

  const variants = PRESETS[preset];

  const trigger = child
    ? {}
    : { initial: "hidden" as const, whileInView: "visible" as const, viewport: VIEWPORT };

  // `imageReveal` settles a photograph down from a slight overscale. Scaling
  // the outer element would widen the page by a couple of pixels while it
  // waits offscreen, so the scale happens inside a box that clips it.
  if (preset === "imageReveal") {
    return (
      <MotionTag id={id} className={cn("overflow-clip", className)}>
        <motion.div
          className="h-full w-full"
          variants={variants}
          {...trigger}
          transition={transition(duration ?? DURATION.section, delay)}
        >
          {children}
        </motion.div>
      </MotionTag>
    );
  }

  return (
    <MotionTag
      id={id}
      className={cn(className)}
      variants={variants}
      {...trigger}
      transition={transition(duration ?? DURATION.section, delay)}
    >
      {children}
    </MotionTag>
  );
}

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  as?: Tag;
  stagger?: number;
  delay?: number;
}

/** Parent that releases its <Reveal child> descendants one after another. */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = STAGGER.default,
  delay = 0,
}: StaggerProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as React.ComponentType<HTMLMotionProps<"div">>;

  if (reduce) return <MotionTag className={cn(className)}>{children}</MotionTag>;

  return (
    <MotionTag
      className={cn(className)}
      variants={staggerChildren(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </MotionTag>
  );
}
