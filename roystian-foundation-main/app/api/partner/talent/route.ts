import { NextResponse } from "next/server";
import { publishedProfiles } from "@/lib/server/profiles";
import { requireStaff } from "@/lib/server/staff";

/** Published Career Passports for partner organisations. */
export async function GET() {
  const auth = await requireStaff(["partner", "admin"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json(
    { profiles: await publishedProfiles(auth.ctx.admin) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
