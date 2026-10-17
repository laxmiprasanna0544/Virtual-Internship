"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InfoNote } from "@/components/admin/info-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";
import { TRAINERS } from "@/data/trainers";
import { initials as toInitials } from "@/lib/utils";

/** Trainer profiles. Read-only: see the note. */
export function AdminTrainers() {
  const trainers = TRAINERS;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trainers"
        description="Trainer profiles assigned to the Industry-Led programme across domains."
      />

      <InfoNote>
        Trainer profiles are maintained in the codebase and released with the application.
        A trainer&apos;s console access comes from their sign-in account (role and domains),
        which an administrator grants in the database. The current profiles are placeholders
        until the trainer roster is confirmed.
      </InfoNote>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer) => (
          <article
            key={trainer.id}
            className={`flex flex-col rounded-2xl border bg-card p-5 shadow-soft ${
              trainer.active ? "border-border" : "border-dashed border-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 font-display text-sm font-semibold text-primary">
                {trainer.initials || toInitials(trainer.name)}
              </span>
              <Badge variant={trainer.active ? "success" : "secondary"}>
                {trainer.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <h2 className="mt-3.5 text-sm font-semibold text-foreground">
              {trainer.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trainer.role} · {trainer.industry}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {trainer.experience} · {trainer.specialization}
            </p>
            <p className="mt-2.5 flex-1 text-xs leading-relaxed text-muted-foreground">
              {trainer.bio}
            </p>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {trainer.domains.map((domainId) => (
                <span
                  key={domainId}
                  className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                >
                  {DOMAINS.find((d) => d.id === domainId)?.shortName ?? domainId}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/trainers/${trainer.id}`}>
                  <ExternalLink /> Profile
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
