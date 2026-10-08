"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { domainImage } from "@/lib/images";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Domain } from "@/types";

/**
 * Interactive domain explorer.
 *
 * Twelve tracks, one at a time: the list on the left drives a single large
 * photograph and description on the right. Arrow keys move between tracks,
 * and on small screens the same data becomes a snap-scrolling rail.
 */
export function DomainExplorer({ domains }: { domains: Domain[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const active = domains[index];
  const image = domainImage(active.id);
  const listRef = React.useRef<HTMLDivElement>(null);

  const move = React.useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0) return domains.length - 1;
        if (next >= domains.length) return 0;
        return next;
      });
    },
    [domains.length],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(domains.length - 1);
    }
  };

  return (
    <div>
      {/* ── Desktop: list drives one large image ────────────────────── */}
      <div className="hidden gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Internship domains"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="relative"
        >
          {domains.map((domain, i) => {
            const selected = i === index;
            return (
              <button
                key={domain.id}
                role="tab"
                id={`domain-tab-${domain.id}`}
                aria-selected={selected}
                aria-controls="domain-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setIndex(i)}
                onMouseEnter={() => setIndex(i)}
                onFocus={() => setIndex(i)}
                className={cn(
                  "group relative flex w-full items-center gap-4 border-b border-border px-1 py-3.5 text-left transition-colors last:border-0",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="domain-active"
                    className="absolute inset-y-0 -left-4 w-[2px] bg-primary"
                    transition={{ duration: 0.35, ease: EASE }}
                    aria-hidden="true"
                  />
                )}
                <span className="font-mono text-[0.68rem] tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <DynamicIcon name={domain.icon} className="h-[1.05rem] w-[1.05rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
                    {domain.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {domain.tagline}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-300",
                    selected
                      ? "translate-x-0 text-primary opacity-100"
                      : "-translate-x-1 opacity-0",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <div
          id="domain-panel"
          role="tabpanel"
          aria-labelledby={`domain-tab-${active.id}`}
          className="sticky top-28"
        >
          <div className="mask-arch relative aspect-[16/11] overflow-hidden border border-border bg-muted">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={image.src}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  className="object-cover"
                  style={{ objectPosition: image.position }}
                />
              </motion.div>
            </AnimatePresence>
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink-surface/80 via-ink-surface/15 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                    {active.category} · {active.code}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.015em] text-white">
                    {active.name}
                  </h3>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-6"
            >
              <p className="max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
                {active.description}
              </p>
              <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Modules</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {active.modules.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Levels</dt>
                  <dd className="mt-0.5 font-semibold capitalize text-foreground">
                    {active.levels.join(" · ")}
                  </dd>
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">Practical activity</dt>
                  <dd className="mt-0.5 truncate font-semibold text-foreground">
                    {active.practicalTask.title}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="group">
                  <Link href={`/internships/${active.id}`}>
                    View this internship <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/start">Start in {active.shortName}</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile / tablet: a swipeable rail ───────────────────────── */}
      <MobileRail domains={domains} />
    </div>
  );
}

function MobileRail({ domains }: { domains: Domain[] }) {
  const railRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  };

  return (
    <div className="lg:hidden">
      <div
        ref={railRef}
        className="snap-rail -mx-5 gap-4 px-5 pb-2"
        role="group"
        aria-label="Internship domains"
      >
        {domains.map((domain) => {
          const image = domainImage(domain.id);
          return (
            <article
              key={domain.id}
              className="w-[78vw] max-w-[20rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="78vw"
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  className="object-cover"
                  style={{ objectPosition: image.position }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-ink-surface/75 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
                    <DynamicIcon name={domain.icon} className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-white">
                    {domain.shortName}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {domain.tagline}
                </p>
                <Link
                  href={`/internships/${domain.id}`}
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  View internship <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Swipe to browse all twelve</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous domains"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="More domains"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
