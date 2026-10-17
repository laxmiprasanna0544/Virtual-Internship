import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { withAnon } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  collegeName: z.string().trim().min(2).max(200),
  city: z.string().trim().max(100).default(""),
  state: z.string().trim().max(100).default(""),
  institutionType: z.enum(["engineering", "degree", "university", "training"]).nullable().optional(),
  departments: z.string().trim().max(500).default(""),
  yearBatch: z.string().trim().max(100).default(""),
  contactPerson: z.string().trim().min(2).max(120),
  designation: z.string().trim().max(120).default(""),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).default(""),
  studentCount: z.string().trim().max(50).default(""),
  interest: z.string().trim().max(200).default(""),
  message: z.string().trim().max(4000).default(""),
  // Honeypot: hidden from people, filled in by naive bots.
  website: z.string().max(0).optional(),
});

/** Public college enquiry form. Anyone may submit; only admins can read. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`lead:${clientIp(req)}`, 10, 600);
  if (limited) return limited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }
  const v = parsed.data;
  await withAnon((tx) => tx`
    insert into public.college_leads
      (college_name, city, state, institution_type, departments, year_batch, contact_person,
       designation, email, phone, student_count, interest, message)
    values (${v.collegeName}, ${v.city}, ${v.state}, ${v.institutionType ?? null}, ${v.departments},
            ${v.yearBatch}, ${v.contactPerson}, ${v.designation}, ${v.email}, ${v.phone},
            ${v.studentCount}, ${v.interest}, ${v.message})`);
  return NextResponse.json({ ok: true });
}
