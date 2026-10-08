"use client";

import { getDB, updateDB } from "@/lib/db";
import { uid } from "@/lib/ids";
import type { CollegeLead } from "@/types";

export function listLeads(): CollegeLead[] {
  return [...getDB().leads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createLead(
  input: Omit<CollegeLead, "id" | "status" | "createdAt">,
): CollegeLead {
  const lead: CollegeLead = {
    ...input,
    id: uid("lead"),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => {
    db.leads = [lead, ...db.leads];
  });
  return lead;
}

export function setLeadStatus(id: string, status: CollegeLead["status"]): void {
  updateDB((db) => {
    db.leads = db.leads.map((l) => (l.id === id ? { ...l, status } : l));
  });
}
