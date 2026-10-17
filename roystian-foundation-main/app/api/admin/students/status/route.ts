import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, setUserEnabled } from "@/lib/server/identity";
import { getSql } from "@/lib/server/db";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

/**
 * Suspends or reactivates a student. The database status takes effect on the
 * next request (every student API and protected page checks it). Suspension
 * also disables the account and revokes every session, so the student is
 * signed out everywhere and cannot sign in again.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request.");
  const { studentId, status } = parsed.data;

  const [row] = await getSql()<{ id: string }[]>`
    update public.students set status = ${status} where id = ${studentId} returning id`;
  if (!row) return badRequest("Student not found.", 404);

  try {
    await setUserEnabled(row.id, status === "active");
  } catch (error) {
    console.error("account enable/disable failed:", identityError(error));
    return badRequest("Status saved, but sign-in access could not be updated. Try again.", 500);
  }

  await audit(ctx, `student.${status === "suspended" ? "suspend" : "reactivate"}`, "student", studentId);
  return NextResponse.json({ ok: true });
}
