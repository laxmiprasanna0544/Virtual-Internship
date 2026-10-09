"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CollegeLead } from "@/types";

/**
 * Submits the public college enquiry form. Anyone may insert a lead (RLS),
 * but only admins can read them.
 */
export async function createLead(
  input: Omit<CollegeLead, "id" | "status" | "createdAt">,
): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("college_leads")
    .insert({
      college_name: input.collegeName,
      city: input.city,
      state: input.state,
      institution_type: input.institutionType || null,
      departments: input.departments,
      year_batch: input.yearBatch,
      contact_person: input.contactPerson,
      designation: input.designation,
      email: input.email,
      phone: input.phone,
      student_count: input.studentCount,
      interest: input.interest,
      message: input.message,
    });
  if (error) throw new Error("Your enquiry could not be sent. Please try again.");
}
