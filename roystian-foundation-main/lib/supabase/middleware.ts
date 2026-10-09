import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { homeForRole, protectionFor } from "@/lib/supabase/roles";

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * role-based access to protected routes on the server.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token with the auth server; do not use
  // getSession() for authorisation decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rule = protectionFor(request.nextUrl.pathname);
  if (!rule) return response;

  const redirect = (pathname: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const redirectResponse = NextResponse.redirect(url);
    // Carry any refreshed session cookies across the redirect.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  if (!user) {
    return redirect("/login", request.nextUrl.pathname + request.nextUrl.search);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return redirect("/login");
  if (!rule.allow.includes(profile.role)) return redirect(homeForRole(profile.role));

  return response;
}
