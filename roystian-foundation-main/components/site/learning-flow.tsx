"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Award, BookOpen, CheckCircle2, ClipboardCheck, PenLine } from "lucide-react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "Read",
    icon: BookOpen,
    body: "Work through the module material at your own pace, with objectives, key concepts and downloadable resources.",
  },
  {
    label: "Practice",
    icon: PenLine,
    body: "Apply each module to the domain practical activity — the same kind of task the work actually involves.",
  },
  {
    label: "Assess",
    icon: ClipboardCheck,
    body: "Take the module assessment. 70% to pass, unlimited retakes, answers explained afterwards.",
  },
  {
    label: "Complete",
    icon: CheckCircle2,
    body: "Finish every module, submit the practical task for review and pass the final assessment.",
  },
  {
    label: "Certify",
    icon: Award,
    body: "The certificate unlocks and its public verification page goes live.",
  },
];

/**
 * The self-paced loop, shown as a chain that fills in as it scrolls into view.
 * Deliberately has no video step: the ₹1,500 track is read, practise, assess.
 */
export function LearningFlow({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-5", className)}>
      {STEPS.map((step, index) => (
        <Step key={step.label} {...step} index={index} last={index === STEPS.length - 1} />
      ))}
    </ol>
  );
}

function Step({
  label,
  body,
  icon: Icon,
  index,
  last,
}: {
  label: string;
  body: string;
  icon: typeof BookOpen;
  index: number;
  last: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px -20% 0px" });
  const on = reduce || inView;

  return (
    <li ref={ref} className="relative">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={on ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.07, ease: EASE }}
        className={cn(
          "h-full rounded-2xl border p-5 transition-colors duration-500",
          on ? "border-primary/30 bg-card shadow-soft" : "border-border bg-card/60",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-500",
              on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-[0.68rem] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.1em] text-foreground">
          {label}
        </h3>
        <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </motion.div>

      {/* Connector, drawn only between cards on the wide layout. */}
      {!last && (
        <motion.span
          aria-hidden="true"
          className="absolute -right-2 top-1/2 hidden h-px w-4 origin-left bg-primary/40 lg:block"
          initial={reduce ? false : { scaleX: 0 }}
          animate={on ? { scaleX: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.07 + 0.25, ease: EASE }}
        />
      )}
    </li>
  );
}
