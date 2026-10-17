import { NextResponse } from "next/server";
import { fetchAdminData } from "@/lib/server/admin-records";
import { withUser } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/staff";

/**
 * The staff console dataset. Loaded as the caller, so row level security
 * decides what is in it: admins see everything, trainers the students in
 * their domains, a college placement cell its own cohort.
 */
export async function GET() {
  const auth = await requireStaff(["admin", "trainer", "college"]);
  if (!auth.ok) return auth.response;
  const data = await withUser(auth.ctx.userId, (tx) => fetchAdminData(tx));
  return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
}
