"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { BookOpen, Check, Clock3, List } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReadingSection {
  heading: string;
  body: string;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The module reader. The self-paced track is content based rather than video
 * based, so this is the primary learning surface: estimated reading time, a
 * contents list that tracks the heading you are on, and a progress bar driven
 * by how far through the material you have scrolled.
 */
export function ReadingPane({
  moduleNumber,
  title,
  summary,
  readMinutes,
  sections,
  completed,
}: {
  moduleNumber: number;
  title: string;
  summary: string;
  readMinutes: number;
  sections: ReadingSection[];
  completed: boolean;
}) {
  const reduce = useReducedMotion();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = React.useState<string>(() =>
    sections.length ? slug(sections[0].heading) : "",
  );

  const { scrollYProgress } = useScroll({
    target: bodyRef,
    offset: ["start 80%", "end 60%"],
  });
  const width = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  React.useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(slug(section.heading)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-xs font-semibold text-primary">
            Module {String(moduleNumber).padStart(2, "0")}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {readMinutes} min read
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-[0.68rem] font-semibold text-success">
              <Check className="h-3 w-3" aria-hidden="true" /> Completed
            </span>
          )}
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold tracking-[-0.01em] text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </header>

      {/* Reading progress for the material below. */}
      <div className="h-0.5 w-full bg-muted" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-primary"
          style={reduce ? { transform: "scaleX(1)" } : { scaleX: width }}
        />
      </div>

      <div className="grid gap-0 lg:grid-cols-[13.5rem_1fr]">
        <nav
          aria-label="Module contents"
          className="hidden border-r border-border px-5 py-6 lg:block"
        >
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <List className="h-3.5 w-3.5" aria-hidden="true" /> Contents
          </p>
          <ol className="mt-4 space-y-1">
            {sections.map((section) => {
              const id = slug(section.heading);
              const active = id === activeId;
              return (
                <li key={section.heading}>
                  <a
                    href={`#${id}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "block border-l-2 py-1.5 pl-3 text-[0.8rem] leading-snug transition-colors",
                      active
                        ? "border-primary font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {section.heading}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div ref={bodyRef} className="min-w-0 px-6 py-6">
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:hidden">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Learning material
          </p>
          <div className="mt-4 space-y-7 lg:mt-0">
            {sections.map((section) => (
              <article key={section.heading} className="scroll-mt-24">
                <h3
                  id={slug(section.heading)}
                  className="scroll-mt-24 font-display text-base font-semibold text-foreground"
                >
                  {section.heading}
                </h3>
                <p className="mt-2 max-w-[68ch] text-[0.925rem] leading-[1.75] text-muted-foreground">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
