"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Gauge, IdCard, Trophy } from "lucide-react";
import { useCareerContext } from "@/lib/career";
import { readinessBand } from "@/lib/readiness";
import { cn } from "@/lib/utils";

/**
 * The career evidence summary on the dashboard overview.
 *
 * The PRD's dashboard leads with the readiness score, so this sits directly
 * under the programme card — the student sees their evidence position before
 * they see their module list.
 */
export function CareerStrip() {
  const career = useCareerContext();

  if (!career.ready) return null;

  const band = readinessBand(career.readiness.score);
  const submittedProjects = career.projects.filter(
    (p) => p.status === "submitted" || p.status === "evaluated",
  ).length;

  const tiles = [
    {
      href: "/dashboard/readiness",
      icon: Gauge,
      label: "Career Readiness",
      value: `${career.readiness.score}`,
      suffix: "/100",
      hint: band.label,
    },
    {
      href: "/dashboard/badges",
      icon: Trophy,
      label: "Skill Badges",
      value: `${career.earnedBadges.length}`,
      suffix: `/${career.badges.length}`,
      hint: career.earnedBadges.length ? "earned" : "none yet",
    },
    {
      href: "/dashboard/projects",
      icon: FolderKanban,
      label: "Projects",
      value: `${submittedProjects}`,
      suffix: `/${career.briefs.length}`,
      hint: submittedProjects ? "submitted" : "not started",
    },
    {
      href: "/dashboard/passport",
      icon: IdCard,
      label: "Career Passport",
      value: career.passport?.published ? "Public" : "Private",
      suffix: "",
      hint: career.passport?.published ? "shareable link live" : "not published",
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="eyebrow">Career evidence</h2>
        <Link
          href="/dashboard/readiness"
          className="group inline-flex items-center gap-1 text-[0.78rem] font-semibold text-primary"
        >
          Full breakdown
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="lift-card rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[0.62rem]">{tile.label}</span>
              <tile.icon
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
            </div>
            <p
              className={cn(
                "mt-3 font-display font-semibold tracking-tight text-foreground",
                tile.suffix ? "text-3xl" : "text-xl",
              )}
            >
              {tile.value}
              {tile.suffix && (
                <span className="text-base font-normal text-muted-foreground">
                  {tile.suffix}
                </span>
              )}
            </p>
            <p className="mt-1 text-[0.74rem] text-muted-foreground">
              {tile.hint}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
