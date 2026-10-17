"use client";

import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InfoNote } from "@/components/admin/info-note";
import { Badge } from "@/components/ui/badge";
import { PROGRAMS } from "@/data/programs";
import { formatINR } from "@/lib/utils";

/** The programmes offered with each internship. Read-only: see the note. */
export function AdminPrograms() {
  const programs = PROGRAMS;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Programs"
        description="The programmes offered with each internship, their prices and what they include."
      />

      <InfoNote>
        Programmes and prices are maintained in the codebase and released with the
        application. Checkout charges exactly these prices, computed on the server, so a
        price change is a reviewed code change rather than an edit here.
      </InfoNote>

      <div className="grid gap-5 lg:grid-cols-2">
        {programs.map((program) => (
          <article
            key={program.id}
            className={`min-w-0 rounded-2xl border bg-card p-5 shadow-soft ${
              program.active ? "border-border" : "border-dashed border-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold text-foreground">
                  {program.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{program.tagline}</p>
              </div>
              <Badge variant={program.active ? "success" : "secondary"} className="shrink-0">
                {program.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <p className="mt-4 font-display text-2xl font-semibold text-foreground">
              {formatINR(program.price)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {program.durationLabel}
              </span>
            </p>

            <ul className="mt-4 space-y-1.5">
              {program.features.slice(0, 5).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {program.features.length > 5 && (
                <li className="text-xs text-muted-foreground">
                  +{program.features.length - 5} more
                </li>
              )}
            </ul>

            <dl className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
              <Badge variant={program.certificateEnabled ? "default" : "secondary"}>
                Certificate {program.certificateEnabled ? "enabled" : "disabled"}
              </Badge>
              <Badge variant={program.pehlaChanceIncluded ? "default" : "secondary"}>
                PehlaChance {program.pehlaChanceIncluded ? "included" : "not included"}
              </Badge>
              <Badge variant={program.liveSessions ? "default" : "secondary"}>
                {program.liveSessions ? "Live sessions" : "Self-paced"}
              </Badge>
            </dl>

          </article>
        ))}
      </div>
    </div>
  );
}
