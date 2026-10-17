"use client";

import type { CollegeLead } from "@/types";

/**
 * Submits the public college enquiry form. Anyone may send a lead; only
 * admins can read them.
 */
export async function createLead(
  input: Omit<CollegeLead, "id" | "status" | "createdAt"> & { website?: string },
): Promise<void> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collegeName: input.collegeName,
      city: input.city,
      state: input.state,
      institutionType: input.institutionType || null,
      departments: input.departments,
      yearBatch: input.yearBatch,
      contactPerson: input.contactPerson,
      designation: input.designation,
      email: input.email,
      phone: input.phone,
      studentCount: input.studentCount,
      interest: input.interest,
      message: input.message,
      website: input.website ?? "",
    }),
  }).catch(() => null);
  if (!res?.ok) {
    throw new Error(
      res?.status === 429
        ? "Too many enquiries from this connection. Please try again later."
        : "Your enquiry could not be sent. Please try again.",
    );
  }
}
