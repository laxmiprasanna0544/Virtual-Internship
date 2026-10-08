"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { Card } from "@/components/ui/card";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Splits a formatted figure into the parts a counter can animate:
 * "₹1,25,000" -> prefix "₹", 125000; "82%" -> 82, suffix "%".
 * Anything that is not a single number is left alone and rendered as text.
 */
function parseFigure(value: string | number) {
  if (typeof value === "number") return { prefix: "", number: value, suffix: "" };
  const match = value.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!match) return null;
  const number = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  return { prefix: match[1], number, suffix: match[3] };
}

/** Re-applies Indian digit grouping to a counted value when the source had it. */
function grouped(value: number) {
  return value.toLocaleString("en-IN");
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  /** Delay the entrance so a row of cards arrives in sequence. */
  delay = 0,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const figure = parseFigure(value);
  const useGrouping = typeof value === "string" && value.includes(",");

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      <Card
        className={cn(
          "group h-full p-5 transition-[border-color,box-shadow] duration-300 hover:border-primary/25 hover:shadow-card",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
          {figure ? (
            <AnimatedCounter
              value={figure.number}
              prefix={figure.prefix}
              suffix={figure.suffix}
              format={useGrouping ? grouped : undefined}
              duration={1}
            />
          ) : (
            value
          )}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.direction === "up" ? "text-success" : "text-destructive",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </Card>
    </motion.div>
  );
}
