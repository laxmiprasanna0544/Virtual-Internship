import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { INSUFFICIENT_PRIVILEGE, pgCode, withUser } from "@/lib/server/db";

const body = z.object({
  domainId: z.string().min(1).max(100),
  moduleId: z.string().min(1).max(200),
  complete: z.boolean(),
});

/** Marks a module complete or not. The database function checks enrolment. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { domainId, moduleId, complete } = parsed.data;
  try {
    const [row] = await withUser(auth.user.id, (tx) =>
      tx`select public.set_module_complete(${domainId}, ${moduleId}, ${complete}) as completed`,
    );
    return NextResponse.json({ completedModules: row?.completed ?? [] });
  } catch (error) {
    if (pgCode(error) === INSUFFICIENT_PRIVILEGE) {
      return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
    }
    console.error("set_module_complete failed:", pgCode(error));
    return NextResponse.json({ error: "Unable to update module progress." }, { status: 500 });
  }
}
