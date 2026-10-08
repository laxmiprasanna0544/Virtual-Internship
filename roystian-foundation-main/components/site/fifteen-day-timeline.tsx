"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FIFTEEN_DAY_PHASES } from "@/data/content";
import { EASE } from "@/lib/motion";
import { useProgressLine } from "@/lib/use-progress-line";
import { cn } from "@/lib/utils";

/**
 * The Industry-Led 15-day schedule.
 *
 * A progress indicator tracks the reader's position through the five phases,
 * so the structure of the programme is legible before anyone reads a word.
 */
export function FifteenDayTimeline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const scale = useProgressLine(ref);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Horizontal track on wide screens, vertical below. */}
      <span
        className="absolute left-0 right-0 top-[0.6rem] hidden h-px bg-border lg:block"
        aria-hidden="true"
      />
      <motion.span
        className="absolute left-0 right-0 top-[0.6rem] hidden h-px origin-left bg-primary lg:block"
        style={reduce ? { transform: "scaleX(1)" } : { scaleX: scale }}
        aria-hidden="true"
      />
      <span
        className="absolute left-[0.58rem] top-2 h-[calc(100%-1rem)] w-px bg-border lg:hidden"
        aria-hidden="true"
      />
      <motion.span
        className="absolute left-[0.58rem] top-2 h-[calc(100%-1rem)] w-px origin-top bg-primary lg:hidden"
        style={reduce ? { transform: "scaleY(1)" } : { scaleY: scale }}
        aria-hidden="true"
      />

      <ol className="relative grid gap-7 lg:grid-cols-5 lg:gap-5">
        {FIFTEEN_DAY_PHASES.map((phase, index) => (
          <Phase
            key={phase.label}
            index={index}
            label={phase.label}
            title={phase.title}
            description={phase.description}
          />
        ))}
      </ol>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-xs text-muted-foreground sm:text-sm">
        <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-foreground">Guided Programme Requirement:</strong> The
          certificate will be generated only after the completion of live classes, that is the
          duration period mentioned which is 15 days.
        </p>
      </div>
    </div>
  );
}

function Phase({
  index,
  label,
  title,
  description,
}: {
  index: number;
  label: string;
  title: string;
  description: string;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-35% 0px -25% 0px" });
  const on = reduce || inView;

  return (
    <li ref={ref} className="relative flex gap-4 lg:block lg:pr-6">
      <span
        className={cn(
          "relative z-10 mt-1 flex h-[1.2rem] w-[1.2rem] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 lg:mt-0",
          on ? "border-primary bg-primary" : "border-border bg-background",
        )}
        aria-hidden="true"
      >
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-primary-foreground"
          initial={reduce ? false : { scale: 0 }}
          animate={on ? { scale: 1 } : {}}
          transition={{ duration: 0.3, ease: EASE }}
        />
      </span>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={on ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
        className="min-w-0 lg:mt-5"
      >
        <p className="font-mono text-[0.7rem] font-semibold text-primary">{label}</p>
        <h3 className="mt-2 text-[0.95rem] font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </motion.div>
    </li>
  );
}
