"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function OnboardingStepper({ current }: { current: number }) {
  const reduce = useReducedMotion();
  const total = ONBOARDING_STEPS.length;
  const percent = Math.round(((current - 1) / (total - 1)) * 100);

  return (
    <nav aria-label="Onboarding progress" className="w-full">
      {/* Compact rail on small screens: one bar plus the current label. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">
            {ONBOARDING_STEPS[current - 1]?.label}
          </p>
          <p className="font-mono text-[0.68rem] text-muted-foreground">
            {current} / {total}
          </p>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${percent || 6}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </div>

      <ol className="hidden items-center gap-1 sm:flex sm:gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const state =
            index + 1 < current ? "done" : index + 1 === current ? "current" : "todo";
          return (
            <li key={step.step} className="flex min-w-0 flex-1 items-center gap-2">
              <motion.span
                initial={false}
                animate={
                  reduce
                    ? undefined
                    : { scale: state === "current" ? 1.06 : 1 }
                }
                transition={{ duration: 0.3, ease: EASE }}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[0.65rem] font-semibold transition-colors duration-300",
                  state === "done" && "border-success/40 bg-success/10 text-success",
                  state === "current" &&
                    "border-primary bg-primary text-primary-foreground shadow-soft",
                  state === "todo" &&
                    "border-border bg-background text-muted-foreground",
                )}
                aria-current={state === "current" ? "step" : undefined}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  step.step
                )}
              </motion.span>
              <span
                className={cn(
                  "hidden truncate text-xs font-medium transition-colors md:block",
                  state === "current" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < total - 1 && (
                <span
                  className="relative hidden h-px flex-1 bg-border lg:block"
                  aria-hidden="true"
                >
                  <motion.span
                    className="absolute inset-0 origin-left bg-success/50"
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: state === "done" ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="sr-only">
        Step {current} of {total}: {ONBOARDING_STEPS[current - 1]?.label}
      </p>
    </nav>
  );
}
