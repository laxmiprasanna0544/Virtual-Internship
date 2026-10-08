"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STAGGER, staggerChildren, wordReveal } from "@/lib/motion";

export interface SplitHeadingProps {
  /** Each entry becomes its own line. Words inside a line reveal in sequence. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Class applied to the words of a given line index — used for emphasis. */
  accentLine?: number;
  accentClassName?: string;
  as?: "h1" | "h2";
  delay?: number;
  /** Play immediately (hero) instead of waiting for the viewport. */
  immediate?: boolean;
}

/**
 * Headline whose words rise into place from behind a clipping mask. The full
 * string stays in the DOM as one accessible label; the animated words are
 * hidden from assistive tech so it is never read word by word.
 */
export function SplitHeading({
  lines,
  className,
  lineClassName,
  accentLine,
  accentClassName = "text-primary",
  as = "h2",
  delay = 0,
  immediate = false,
}: SplitHeadingProps) {
  const reduce = useReducedMotion();
  const Tag = as;
  const label = lines.join(" ");

  if (reduce) {
    return (
      <Tag className={cn(className)}>
        {lines.map((line, i) => (
          <span
            key={line}
            className={cn(
              "block",
              lineClassName,
              i === accentLine && accentClassName,
            )}
          >
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  let index = 0;

  return (
    <Tag className={cn(className)} aria-label={label}>
      <motion.span
        aria-hidden="true"
        className="block"
        variants={staggerChildren(STAGGER.tight, delay)}
        initial="hidden"
        {...(immediate
          ? { animate: "visible" }
          : { whileInView: "visible", viewport: { once: true, margin: "-60px" } })}
      >
        {lines.map((line, lineIndex) => (
          <span
            key={line}
            className={cn(
              "block overflow-hidden pb-[0.08em]",
              lineClassName,
              lineIndex === accentLine && accentClassName,
            )}
          >
            {line.split(" ").map((word) => {
              index += 1;
              return (
                <motion.span
                  key={`${word}-${index}`}
                  variants={wordReveal}
                  className="inline-block will-change-transform"
                >
                  {word}
                  {" "}
                </motion.span>
              );
            })}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
