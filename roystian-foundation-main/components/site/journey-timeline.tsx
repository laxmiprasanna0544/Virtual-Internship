"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Award,
  Compass,
  GraduationCap,
  Hammer,
  Rocket,
  Unlock,
} from "lucide-react";
import { JOURNEY_STAGES } from "@/data/content";
import { EASE } from "@/lib/motion";
import { useProgressLine } from "@/lib/use-progress-line";
import { cn } from "@/lib/utils";

const STAGE_ICONS = [GraduationCap, Compass, Hammer, Rocket, Award, Unlock];

/**
 * The six-stage student arc, revealed as the reader scrolls.
 *
 * A single line travels the full list and each stage activates as it passes;
 * the certification stage gets an extra ring so the moment the credential
 * unlocks reads as the turning point it is.
 */
export function JourneyTimeline() {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const lineScale = useProgressLine(ref);

  return (
    <div ref={ref} className="relative">
      {/* ── Desktop: horizontal ─────────────────────────────────────── */}
      <div className="relative hidden lg:block">
        <span
          className="absolute left-0 right-0 top-4 h-px bg-border"
          aria-hidden="true"
        />
        <motion.span
          className="absolute left-0 right-0 top-4 h-px origin-left bg-primary"
          style={reduce ? { transform: "scaleX(1)" } : { scaleX: lineScale }}
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-6">
          {JOURNEY_STAGES.map((stage, index) => (
            <Stage
              key={stage.title}
              index={index}
              total={JOURNEY_STAGES.length}
              title={stage.title}
              description={stage.description}
              horizontal
            />
          ))}
        </ol>
      </div>

      {/* ── Mobile / tablet: vertical ───────────────────────────────── */}
      <div className="relative lg:hidden">
        <span
          className="absolute left-[1.09rem] top-3 h-[calc(100%-1.5rem)] w-px bg-border"
          aria-hidden="true"
        />
        <motion.span
          className="absolute left-[1.09rem] top-3 h-[calc(100%-1.5rem)] w-px origin-top bg-primary"
          style={reduce ? { transform: "scaleY(1)" } : { scaleY: lineScale }}
          aria-hidden="true"
        />
        <ol className="relative space-y-8">
          {JOURNEY_STAGES.map((stage, index) => (
            <Stage
              key={stage.title}
              index={index}
              total={JOURNEY_STAGES.length}
              title={stage.title}
              description={stage.description}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function Stage({
  index,
  total,
  title,
  description,
  horizontal = false,
}: {
  index: number;
  total: number;
  title: string;
  description: string;
  horizontal?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLLIElement>(null);
  const active = useInView(ref, { once: true, margin: "-45% 0px -35% 0px" });
  const Icon = STAGE_ICONS[index] ?? GraduationCap;
  const isLast = index === total - 1;
  const isCertification = title.toLowerCase().startsWith("certification");
  const on = reduce || active;

  return (
    <li
      ref={ref}
      className={cn(
        "relative",
        horizontal ? "pr-6" : "flex gap-4",
        isLast && horizontal && "pr-0",
      )}
    >
      <motion.span
        initial={reduce ? false : { scale: 0.85, opacity: 0.6 }}
        animate={on ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.45, ease: EASE }}
        className={cn(
          "relative z-10 flex h-[2.15rem] w-[2.15rem] shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
          on
            ? "border-primary/40 bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground",
        )}
      >
        <Icon className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
        {/* Certification is the unlock moment — give it one extra ring. */}
        {isCertification && on && !reduce && (
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-primary/45"
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.65, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
            aria-hidden="true"
          />
        )}
      </motion.span>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={on ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
        className={horizontal ? "mt-4" : "pt-1"}
      >
        <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-primary">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-1.5 text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-[0.825rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </motion.div>
    </li>
  );
}
