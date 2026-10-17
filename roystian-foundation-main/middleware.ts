import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/server/db";
import { verifySession } from "@/lib/server/identity";
import { contentSecurityPolicy } from "@/lib/server/security-headers";
import { SESSION_COOKIE, clearSessionCookies } from "@/lib/server/session";
import { staffMfaRequired } from "@/lib/server/staff";
import { homeForRole, protectionFor } from "@/lib/roles";
import type { Role } from "@/types";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Called by Cashfree's servers, authenticated by signature instead of origin.
const CROSS_ORIGIN_POSTS = new Set(["/api/payment/webhook"]);

function siteOrigin(req: NextRequest): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin;
  } catch {
    return req.nextUrl.origin;
  }
}

/**
 * Runs before every page and API request:
 *   1. rejects cross-site writes to /api (CSRF), except the payment webhook;
 *   2. enforces role-based access to protected pages, suspension, and the
 *      staff two-factor requirement (sessions are checked in the database);
 *   3. sets the Content Security Policy.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && !SAFE_METHODS.has(req.method) && !CROSS_ORIGIN_POSTS.has(pathname)) {
    if (req.headers.get("origin") !== siteOrigin(req)) {
      return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
    }
  }

  let clearCookies = false;
  const finish = (response: NextResponse) => {
    if (clearCookies) clearSessionCookies(response.cookies);
    response.headers.set("Content-Security-Policy", contentSecurityPolicy());
    return response;
  };
  const redirect = (to: string, params: Record<string, string> = {}) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    url.search = new URLSearchParams(params).toString();
    return finish(NextResponse.redirect(url));
  };

  const rule = protectionFor(pathname);
  if (rule) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const user = await verifySession(token);
    if (!user) {
      clearCookies = Boolean(token);
      return redirect("/login", { next: pathname + req.nextUrl.search });
    }

    const [profile] = await getSql()<{ role: Role; mfa_enabled: boolean; status: string | null }[]>`
      select p.role, p.mfa_enabled, s.status
      from public.profiles p
      left join public.students s on s.id = p.id
      where p.id = ${user.id}`;
    if (!profile) return redirect("/login");
    if (profile.status === "suspended") {
      clearCookies = true;
      return redirect("/login", { error: "suspended" });
    }
    const isStaff = profile.role !== "student";
    if (isStaff && staffMfaRequired() && !profile.mfa_enabled && !pathname.startsWith("/account/security")) {
      return redirect("/account/security", { required: "1" });
    }
    if (!rule.allow.includes(profile.role)) return redirect(homeForRole(profile.role));
  }

  return finish(NextResponse.next());
}

export const config = {
  runtime: "nodejs",
  matcher: [
    // Everything except static assets, image optimisation and the health check.
    "/((?!api/health|_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
