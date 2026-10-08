"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Lock, Unlock } from "lucide-react";
import { AnimatedCounter, AnimatedProgress } from "@/components/motion/animated-counter";
import { Button } from "@/components/ui/button";
import { EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CompletionRequirement } from "@/types";

export function CompletionChecklist({
  requirements,
  unlocked,
  compact = false,
}: {
  requirements: CompletionRequirement[];
  unlocked: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const done = requirements.filter((r) => r.done).length;
  const percent = requirements.length
    ? Math.round((done / requirements.length) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Certificate Progress
          </h2>
          <p
            className={cn(
              "mt-2 flex items-center gap-2 font-display text-lg font-semibold",
              unlocked ? "text-success" : "text-foreground",
            )}
          >
            {unlocked ? (
              <>
                <Unlock className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                Certificate Earned
              </>
            ) : (
              <>
                <Lock
                  className="h-[1.1rem] w-[1.1rem] text-warning-ink"
                  aria-hidden="true"
                />
                Certificate Locked
              </>
            )}
          </p>
        </div>
        <span className="font-display text-2xl font-semibold text-foreground">
          <AnimatedCounter value={percent} suffix="%" duration={0.9} />
        </span>
      </div>

      <AnimatedProgress
        value={percent}
        className="mt-4 h-2"
        barClassName={unlocked ? "bg-success" : undefined}
        label="Completion requirements progress"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {done} of {requirements.length} requirements complete
      </p>

      <ul className="mt-5 space-y-2.5">
        {requirements.map((requirement, index) => (
          <motion.li
            key={requirement.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -20px 0px" }}
            transition={{
              duration: 0.35,
              delay: index * STAGGER.tight,
              ease: EASE,
            }}
            className="group flex items-start gap-3"
          >
            {requirement.done ? (
              <motion.span
                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: index * STAGGER.tight + 0.1,
                  ease: EASE,
                }}
                className="mt-0.5 shrink-0"
              >
                <CheckCircle2
                  className="h-[1.05rem] w-[1.05rem] text-success"
                  aria-hidden="true"
                />
              </motion.span>
            ) : (
              <Circle
                className="mt-0.5 h-[1.05rem] w-[1.05rem] shrink-0 text-muted-foreground/60"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {requirement.label}
              </p>
              {!compact && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {requirement.detail}
                </p>
              )}
            </div>
            {!requirement.done && (
              <Link
                href={requirement.href}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Go
                <ArrowRight
                  className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            )}
          </motion.li>
        ))}
      </ul>

      {unlocked && (
        <Button asChild className="group mt-5 w-full">
          <Link href="/dashboard/certificate">
            View certificate <ArrowRight className="cta-arrow" />
          </Link>
        </Button>
      )}
    </div>
  );
}
