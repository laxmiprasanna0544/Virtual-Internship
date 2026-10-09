import { NextRequest, NextResponse } from "next/server";
import { publicProfileBySlug } from "@/lib/server/profiles";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/** Public Career Passport. No sign-in; only what the student chose to share. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,64}$/i.test(slug)) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const profile = await publicProfileBySlug(getSupabaseAdminClient(), slug);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json(
    { profile },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
