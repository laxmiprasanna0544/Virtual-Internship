import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { fetchStudentRecordRows } from "@/lib/server/student-records";
import { toStudentRecords } from "@/lib/records/mappers";

/** The signed-in student's records, read under RLS. Null for staff accounts. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const rows = await withUser(auth.user.id, (tx) => fetchStudentRecordRows(tx, auth.user.id));
  const records = rows && rows.profile.role === "student" ? toStudentRecords(rows) : null;
  return NextResponse.json({ records }, { headers: { "Cache-Control": "private, no-store" } });
}
