import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

/**
 * Suspends or reactivates a student. Suspension also bans the auth user, so
 * existing sessions stop refreshing — not just new sign-ins.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");
  const { studentId, status } = parsed.data;

  const { data, error } = await ctx.admin
    .from("students")
    .update({ status })
    .eq("id", studentId)
    .select("id")
    .maybeSingle();
  if (error) return badRequest("Could not update the student.", 500);
  if (!data) return badRequest("Student not found.", 404);

  const { error: banError } = await ctx.admin.auth.admin.updateUserById(studentId, {
    ban_duration: status === "suspended" ? "876000h" : "none",
  });
  if (banError) {
    console.error("auth ban update failed:", banError.message);
    return badRequest("Status saved, but sign-in access could not be updated. Try again.", 500);
  }

  await audit(ctx, `student.${status === "suspended" ? "suspend" : "reactivate"}`, "student", studentId);
  return NextResponse.json({ ok: true });
}
