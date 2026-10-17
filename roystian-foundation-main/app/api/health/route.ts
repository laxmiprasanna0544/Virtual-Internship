import { NextResponse } from "next/server";

// Load balancer liveness check. Excluded from middleware and never touches
// the database, so a slow database never gets healthy containers replaced.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
