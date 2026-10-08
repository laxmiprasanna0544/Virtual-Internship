"use client";

import { DOMAINS } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { TRAINERS } from "@/data/trainers";
import type { Database } from "@/lib/db";
import type { Domain, Program, Trainer } from "@/types";

export interface CatalogProgram extends Omit<Program, "id"> {
  id: string;
  custom: boolean;
}

/**
 * The catalogue the admin area manages. Base entries come from the static
 * content files; admin edits are stored as overrides so the originals stay
 * intact and the demo can be reset cleanly.
 */
export function catalogPrograms(db: Database | null): CatalogProgram[] {
  const base: CatalogProgram[] = PROGRAMS.map((program) => ({
    ...program,
    id: program.id as string,
    custom: false,
    ...(db?.programOverrides?.[program.id] ?? {}),
  }));
  const custom: CatalogProgram[] = (db?.customPrograms ?? []).map((program) => ({
    ...program,
    // Admin-authored programmes list what they include; exclusions are a
    // property of the two standard tracks only.
    excludes: [],
    // Custom programmes have no separate marketing identity — the admin-set
    // name and tagline serve both roles.
    marketingName: program.name,
    promise: program.tagline,
    custom: true,
  }));
  return [...base, ...custom];
}

export interface CatalogDomain extends Domain {
  overridden: boolean;
}

export function catalogDomains(db: Database | null): CatalogDomain[] {
  return DOMAINS.map((domain) => {
    const override = db?.domainOverrides?.[domain.id];
    return {
      ...domain,
      description: override?.description ?? domain.description,
      active: override?.active ?? domain.active,
      practicalTask: override?.practicalBrief
        ? { ...domain.practicalTask, brief: override.practicalBrief }
        : domain.practicalTask,
      overridden: Boolean(override),
    };
  });
}

export function catalogTrainers(db: Database | null): Trainer[] {
  const base = TRAINERS.map((trainer) => ({
    ...trainer,
    ...(db?.trainerOverrides?.[trainer.id] ?? {}),
  }));
  return [...base, ...(db?.customTrainers ?? [])];
}
