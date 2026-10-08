"use client";

import * as React from "react";
import { Check, Columns3, Minus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PROGRAM_FEATURES } from "@/data/programs";
import { EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Side-by-side programme comparison.
 *
 * The self-paced row set deliberately marks video lessons, live sessions,
 * mentoring, the guided project, career guidance and PehlaChance as excluded —
 * this table is the canonical answer to "what do I actually get for ₹1,500?".
 */
export function ComparisonTable({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const row = (index: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: {
            duration: 0.4,
            delay: Math.min(index, 8) * STAGGER.tight,
            ease: EASE,
          },
        };

  return (
    <div className={cn("w-full", className)}>
      {/* ── Desktop: a single comparison grid ───────────────────────── */}
      <div className="scrollbar-thin relative hidden w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-card sm:block">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">
            Feature comparison between the Self-Paced and Industry-Led virtual
            internship programmes
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                What is included
              </th>
              <th scope="col" className="w-[9.5rem] px-5 py-5 text-center">
                <span className="block text-sm font-semibold text-foreground">
                  Self-Paced
                </span>
                <span className="mt-0.5 block font-display text-lg font-semibold text-foreground">
                  ₹1,500
                </span>
              </th>
              <th
                scope="col"
                className="w-[9.5rem] bg-primary/[0.05] px-5 py-5 text-center"
              >
                <span className="block text-sm font-semibold text-primary">
                  Industry-Led
                </span>
                <span className="mt-0.5 block font-display text-lg font-semibold text-foreground">
                  ₹5,000
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {PROGRAM_FEATURES.map((feature, index) => (
              <motion.tr
                key={feature.label}
                {...row(index)}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              >
                <th
                  scope="row"
                  className="px-6 py-4 text-left font-normal align-top"
                >
                  <span className="block text-[0.9rem] font-medium text-foreground">
                    {feature.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {feature.detail}
                  </span>
                </th>
                <td className="px-5 py-4 text-center align-middle">
                  <FeatureMark included={feature.selfPaced} />
                </td>
                <td className="bg-primary/[0.05] px-5 py-4 text-center align-middle">
                  <FeatureMark included={feature.industryLed} highlight />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: the same data as two readable cards ─────────────── */}
      <div className="grid gap-4 sm:hidden">
        <MobileColumn
          name="Self-Paced"
          price="₹1,500"
          included={PROGRAM_FEATURES.filter((f) => f.selfPaced)}
          excluded={PROGRAM_FEATURES.filter((f) => !f.selfPaced)}
        />
        <MobileColumn
          name="Industry-Led"
          price="₹5,000"
          featured
          included={PROGRAM_FEATURES.filter((f) => f.industryLed)}
          excluded={[]}
        />
      </div>
    </div>
  );
}

function MobileColumn({
  name,
  price,
  included,
  excluded,
  featured = false,
}: {
  name: string;
  price: string;
  included: typeof PROGRAM_FEATURES;
  excluded: typeof PROGRAM_FEATURES;
  featured?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft",
        featured ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={cn(
            "text-sm font-semibold",
            featured ? "text-primary" : "text-foreground",
          )}
        >
          {name}
        </h3>
        <p className="font-display text-lg font-semibold text-foreground">{price}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {included.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                featured ? "text-primary" : "text-success",
              )}
              aria-hidden="true"
            />
            <span className="leading-relaxed text-foreground/90">{feature.label}</span>
          </li>
        ))}
      </ul>
      {excluded.length > 0 && (
        <>
          <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Not included
          </p>
          <ul className="mt-2.5 space-y-2">
            {excluded.map((feature) => (
              <li
                key={feature.label}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{feature.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function FeatureMark({
  included,
  highlight,
}: {
  included: boolean;
  highlight?: boolean;
}) {
  return included ? (
    <>
      <Check
        className={cn(
          "mx-auto h-[1.1rem] w-[1.1rem]",
          highlight ? "text-primary" : "text-success",
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
      <span className="sr-only">Not included</span>
    </>
  );
}

export function CompareProgramsButton({
  variant = "outline",
  size = "lg",
  className,
}: {
  variant?: "outline" | "ghost" | "secondary" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={cn("group", className)}>
          <Columns3 /> Compare Programs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Programs</DialogTitle>
          <DialogDescription>
            Both programmes lead to the same verifiable completion certificate. The
            difference is how much guidance you get along the way.
          </DialogDescription>
        </DialogHeader>
        <ComparisonTable className="mt-2" />
      </DialogContent>
    </Dialog>
  );
}
