import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loadAccount } from "@/lib/server/accounts";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";

const body = z.object({
  name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().max(20),
  college: z.string().trim().max(200),
  course: z.string().trim().max(200),
  city: z.string().trim().max(100),
  educationLevel: z.enum(["intermediate", "diploma", "undergraduate", "postgraduate", "working-professional"]),
});

/** The student updates their own details. Column grants limit what can change. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  const v = parsed.data;
  await withUser(auth.user.id, async (tx) => {
    await tx`update public.profiles set full_name = ${v.name} where id = ${auth.user.id}`;
    await tx`
      update public.students
      set mobile = ${v.mobile}, college = ${v.college}, course = ${v.course},
          city = ${v.city}, education_level = ${v.educationLevel}
      where id = ${auth.user.id}`;
  });
  const account = await loadAccount(auth.user.id);
  return NextResponse.json({ ok: true, user: account?.user ?? null });
}
