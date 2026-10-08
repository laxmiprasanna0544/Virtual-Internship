"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { SplitHeading } from "@/components/motion/split-heading";
import type { Crumb } from "@/components/shared/page-header";
import type { ImageAsset } from "@/lib/images";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  image: ImageAsset;
  /** Each entry is one line of the headline; words reveal in sequence. */
  title: string[];
  eyebrow?: string;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  /** Small facts shown under the copy — real numbers only. */
  meta?: { label: string; value: string }[];
  /** Taller opening for the pages that carry the strongest photography. */
  size?: "default" | "tall";
  className?: string;
}

/**
 * Shared opening band for the marketing pages.
 *
 * One photograph under a scrim, a headline that resolves word by word, and
 * the page's primary actions. Using the same component everywhere is what
 * makes the site feel like one product rather than a set of templates.
 */
export function PageHero({
  image,
  title,
  eyebrow,
  description,
  breadcrumbs,
  actions,
  meta,
  size = "default",
  className,
}: PageHeroProps) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section
      className={cn(
        "surface-ink relative isolate flex flex-col justify-end overflow-hidden",
        size === "tall" ? "min-h-[64svh]" : "min-h-[52svh]",
        className,
      )}
    >
      <ParallaxImage
        image={image}
        alt=""
        strength={8}
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-surface/85 via-ink-surface/60 to-ink-surface/90"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-surface/85 via-ink-surface/45 to-transparent"
      />

      <div className="container relative pb-12 pt-28 sm:pb-14 lg:pb-16 lg:pt-36">
        {breadcrumbs && (
          <motion.nav
            {...rise(0.1)}
            aria-label="Breadcrumb"
            className="mb-5"
          >
            <ol className="flex flex-wrap items-center gap-1 text-xs text-white/55">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="rounded transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-white/85">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </motion.nav>
        )}

        {eyebrow && (
          <motion.p
            {...rise(0.18)}
            className="eyebrow flex items-center gap-2.5 text-white/70"
          >
            <span className="h-px w-7 bg-white/40" aria-hidden="true" />
            {eyebrow}
          </motion.p>
        )}

        <SplitHeading
          as="h1"
          immediate
          delay={0.26}
          lines={title}
          className="display-sm mt-4 max-w-[20ch] text-white"
        />

        {description && (
          <motion.p
            {...rise(0.55)}
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            {description}
          </motion.p>
        )}

        {actions && (
          <motion.div
            {...rise(0.66)}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            {actions}
          </motion.div>
        )}

        {meta && meta.length > 0 && (
          <motion.dl
            {...rise(0.74)}
            className="mt-10 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-3"
          >
            {meta.map((item) => (
              <div key={item.label}>
                <dd className="font-display text-xl font-semibold text-white">
                  {item.value}
                </dd>
                <dt className="mt-1 text-[0.72rem] leading-snug text-white/60">
                  {item.label}
                </dt>
              </div>
            ))}
          </motion.dl>
        )}
      </div>
    </section>
  );
}

/** Outline button styling for actions placed on a photographic hero. */
export const heroOutlineButton =
  "border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white";
