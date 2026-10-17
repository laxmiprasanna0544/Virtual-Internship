import { NextRequest, NextResponse } from "next/server";
import { publicProfileBySlug } from "@/lib/server/profiles";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

/** Public Career Passport. No sign-in; only what the student chose to share. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const limited = rateLimit(`profile:${clientIp(req)}`, 60, 60);
  if (limited) return limited;
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,64}$/i.test(slug)) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const profile = await publicProfileBySlug(slug);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json(
    { profile },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
