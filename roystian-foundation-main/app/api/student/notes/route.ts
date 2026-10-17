import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { INSUFFICIENT_PRIVILEGE, pgCode, withUser } from "@/lib/server/db";

const body = z.object({
  domainId: z.string().min(1).max(100),
  moduleId: z.string().min(1).max(200),
  note: z.string().max(20000),
});

/** Saves the student's note for a module. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Your note is too long." }, { status: 400 });
  const { domainId, moduleId, note } = parsed.data;
  try {
    await withUser(auth.user.id, (tx) => tx`select public.save_module_note(${domainId}, ${moduleId}, ${note})`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (pgCode(error) === INSUFFICIENT_PRIVILEGE) {
      return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to save your note." }, { status: 500 });
  }
}
