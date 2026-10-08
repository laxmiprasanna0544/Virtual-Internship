"use client";

import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { Program } from "@/types";

/**
 * Programme card.
 *
 * Self-Paced lists what it excludes as plainly as what it includes — the
 * ₹1,500 track is content based, and a student should never discover that
 * after paying.
 */
export function ProgramCard({
  program,
  href,
  ctaLabel,
  onSelect,
  selected = false,
  className,
}: {
  program: Program;
  href?: string;
  ctaLabel?: string;
  onSelect?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const featured = program.id === "industry-led";
  const label =
    ctaLabel ??
    (program.id === "industry-led" ? "Choose Industry-Led" : "Choose Self-Paced");

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition-[box-shadow,border-color] duration-300 hover:shadow-lift sm:p-7",
        featured ? "border-primary/40 shadow-card" : "border-border hover:border-primary/30",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {featured && (
        <>
          <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-primary-foreground">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> Guided
          </span>
          {/* Animated hairline that traces the featured card on hover. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 transition-all duration-500 group-hover:ring-primary/45"
          />
        </>
      )}

      <div>
        <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">
          {program.name}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{program.tagline}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {formatINR(program.price)}
        </span>
        <span className="text-sm text-muted-foreground">· {program.durationLabel}</span>
      </div>

      <div className="mt-6 flex-1">
        <ul className="space-y-2.5">
          {program.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  featured ? "text-primary" : "text-success",
                )}
                aria-hidden="true"
              />
              <span className="leading-relaxed text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>

        {program.excludes.length > 0 && (
          <div className="mt-5 border-t border-dashed border-border pt-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Not included
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {program.excludes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[0.82rem] text-muted-foreground"
                >
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Best for
        </p>
        <p className="mt-1 text-sm text-foreground">{program.bestFor}</p>
      </div>

      <div className="mt-5">
        {href ? (
          <Button
            asChild
            size="lg"
            variant={featured ? "default" : "outline"}
            className="group/cta w-full"
          >
            <Link href={href}>{label}</Link>
          </Button>
        ) : (
          <Button
            size="lg"
            variant={featured ? "default" : "outline"}
            className="w-full"
            onClick={onSelect}
          >
            {label}
          </Button>
        )}
        {program.pehlaChanceIncluded && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Includes 1 month of{" "}
            <Link href="/pehlachance" className="font-medium text-primary hover:underline">
              PehlaChance
            </Link>{" "}
            at no additional cost.
          </p>
        )}
      </div>
    </motion.article>
  );
}
