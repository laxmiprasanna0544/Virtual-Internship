import type { Role } from "@/types";

/** Where each role lands after signing in. */
export function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "trainer") return "/admin/trainers";
  if (role === "college") return "/campus";
  if (role === "partner") return "/partner";
  return "/dashboard";
}

/**
 * Protected route prefixes and the roles allowed on each. Enforced on the
 * server by middleware.ts; the client RouteGuard mirrors it for UX only.
 */
export const PROTECTED_ROUTES: { prefix: string; allow: Role[] }[] = [
  { prefix: "/dashboard", allow: ["student"] },
  { prefix: "/checkout", allow: ["student"] },
  { prefix: "/payment", allow: ["student"] },
  { prefix: "/admin", allow: ["admin", "trainer"] },
  { prefix: "/campus", allow: ["college", "admin"] },
  { prefix: "/partner", allow: ["partner", "admin"] },
];

export function protectionFor(pathname: string) {
  return PROTECTED_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
