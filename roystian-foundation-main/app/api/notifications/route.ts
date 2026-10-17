import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireUser } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { toNotification, type NotificationRow } from "@/lib/records/mappers";

/** The signed-in user's 50 newest notifications (RLS: own rows only). */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rows = await withUser(auth.user.id, (tx) => tx<NotificationRow[]>`
    select * from public.notifications order by created_at desc limit 50`);
  return NextResponse.json(
    { notifications: rows.map(toNotification) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const body = z.union([z.object({ id: z.string().uuid() }), z.object({ all: z.literal(true) })]);

/** Marks one notification, or all of them, as read. */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = parsed.data;
  await withUser(auth.user.id, (tx) =>
    "id" in input
      ? tx`update public.notifications set read = true where id = ${input.id} and user_id = ${auth.user.id}`
      : tx`update public.notifications set read = true where read = false and user_id = ${auth.user.id}`,
  );
  return NextResponse.json({ ok: true });
}
