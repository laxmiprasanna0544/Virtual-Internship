import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";

const body = z.object({ domainId: z.string().min(1).max(100) });

/** Switches the active domain to another one the student has paid for. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const [row] = await withUser(auth.user.id, (tx) =>
    tx`select public.switch_active_domain(${parsed.data.domainId}) as switched`,
  );
  return NextResponse.json({ switched: Boolean(row?.switched) });
}
