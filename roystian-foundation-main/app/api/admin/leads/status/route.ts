import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "scheduled", "closed"]),
});

/** Moves a college enquiry through follow-up. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request.");
  const { id, status } = parsed.data;

  const rows = await getSql()`
    update public.college_leads set status = ${status} where id = ${id} returning id`;
  if (!rows.length) return badRequest("Lead not found.", 404);

  await audit(auth.ctx, "lead.status", "college_lead", id, { status });
  return NextResponse.json({ ok: true });
}
