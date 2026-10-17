import { NextResponse } from "next/server";
import { getSql } from "@/lib/server/db";

// Readiness: can this container reach the database? For uptime monitoring
// (Route 53 health check), not for the load balancer.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getSql()`select 1`;
    return NextResponse.json({ ok: true, database: "ok" });
  } catch {
    return NextResponse.json({ ok: false, database: "unreachable" }, { status: 503 });
  }
}
