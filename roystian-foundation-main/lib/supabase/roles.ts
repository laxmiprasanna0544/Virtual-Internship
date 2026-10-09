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

/**
 * The parts of /admin a trainer may open: their students, submission and
 * project review, and the trainer directory. Finance, catalogue, leads,
 * analytics and settings are admin-only.
 */
export const TRAINER_ADMIN_SECTIONS = [
  "/admin/students",
  "/admin/assignments",
  "/admin/projects",
  "/admin/trainers",
] as const;

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function protectionFor(pathname: string) {
  const rule = PROTECTED_ROUTES.find(({ prefix }) => matches(pathname, prefix));
  if (rule?.prefix === "/admin" && !TRAINER_ADMIN_SECTIONS.some((s) => matches(pathname, s))) {
    return { prefix: rule.prefix, allow: ["admin"] as Role[] };
  }
  return rule;
}
