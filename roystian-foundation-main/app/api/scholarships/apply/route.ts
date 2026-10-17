import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";

const body = z.object({
  requestedTier: z.union([z.literal(50), z.literal(75), z.literal(100)]),
  householdIncomeBand: z.string().max(100),
  category: z.string().max(100),
  statement: z.string().trim().min(20, "Tell us a little more.").max(4000),
});

/** Submits a scholarship application. Submitted applications are final. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid application." }, { status: 400 });
  }
  const v = parsed.data;
  const result = await withUser(userId, async (tx) => {
    const open = await tx`
      select 1 from public.scholarship_applications
      where student_id = ${userId} and status in ('submitted', 'under-review') limit 1`;
    if (open.length) return "open" as const;
    await tx`
      insert into public.scholarship_applications
        (student_id, requested_tier, household_income_band, category, statement)
      values (${userId}, ${v.requestedTier}, ${v.householdIncomeBand}, ${v.category}, ${v.statement})`;
    return "ok" as const;
  });
  if (result === "open") {
    return NextResponse.json({ error: "You already have an application under review." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
