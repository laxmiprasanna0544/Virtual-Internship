import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";

const body = z.object({ sections: z.record(z.string().max(50), z.string().max(5000)) });

/** Saves the student's LinkedIn section drafts. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid drafts." }, { status: 400 });
  await withUser(auth.user.id, (tx) => tx`
    insert into public.linkedin_drafts (student_id, sections, updated_at)
    values (${auth.user.id}, ${tx.json(parsed.data.sections)}, now())
    on conflict (student_id) do update set sections = excluded.sections, updated_at = now()`);
  return NextResponse.json({ ok: true });
}
