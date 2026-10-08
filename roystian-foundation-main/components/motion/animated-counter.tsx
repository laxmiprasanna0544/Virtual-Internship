"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedCounterProps {
  value: number;
  /** Decimal places to keep while counting. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Seconds. */
  duration?: number;
  /** Formats the counted number — e.g. Indian digit grouping. */
  format?: (value: number) => string;
  className?: string;
}

/** Decelerating curve, matching the rest of the motion system. */
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Counts from zero to `value` the first time it scrolls into view.
 *
 * Driven by requestAnimationFrame against a captured start time, so the number
 * always lands exactly on `value` — a stat that reads "0" because a tween was
 * interrupted is worse than no animation at all. The true figure is also kept
 * in the accessibility tree the whole time.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.2,
  format,
  className,
}: AnimatedCounterProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [inView, setInView] = React.useState(false);
  const [display, setDisplay] = React.useState(0);

  // A plain observer rather than a shared one: these numbers sit in the hero,
  // where the element is often already on screen at mount.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce || duration <= 0) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(value * easeOutExpo(t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      setDisplay(value);
    };
  }, [inView, reduce, value, duration]);

  const shown =
    decimals > 0
      ? display.toFixed(decimals)
      : (format ?? String)(Math.round(display));

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span className="sr-only">
        {`${prefix}${format ? format(value) : value}${suffix}`}
      </span>
      <span aria-hidden="true">{`${prefix}${shown}${suffix}`}</span>
    </span>
  );
}

export interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
  delay?: number;
}

/** Progress bar that fills from zero when it enters the viewport. */
export function AnimatedProgress({
  value,
  className,
  barClassName,
  label,
  delay = 0,
}: AnimatedProgressProps) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={cn("h-full rounded-full bg-primary", barClassName)}
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
