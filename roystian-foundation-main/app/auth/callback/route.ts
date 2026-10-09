import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Landing point for Supabase email links (signup confirmation, password
 * recovery, email change). Exchanges the one-time code for a session cookie,
 * then continues to `next`.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next")) ?? "/dashboard";
  const url = req.nextUrl.clone();
  url.search = "";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      url.pathname = next;
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/login";
  url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}
