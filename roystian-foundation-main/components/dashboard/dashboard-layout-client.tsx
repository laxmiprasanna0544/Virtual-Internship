"use client";

import { usePathname } from "next/navigation";
import { AppShell, STUDENT_NAV } from "@/components/dashboard/shell";
import { RouteGuard } from "@/components/dashboard/guard";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/internship": "My Internship",
  "/dashboard/learning": "Learning",
  "/dashboard/assignments": "Assignments",
  "/dashboard/assessments": "Assessments",
  "/dashboard/schedule": "Schedule",
  "/dashboard/certificate": "Certificate",
  "/dashboard/profile": "Profile",
};

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/dashboard/learning")
      ? "Learning"
      : pathname.startsWith("/dashboard/assessments")
        ? "Assessments"
        : "Dashboard");

  return (
    <RouteGuard allow={["student"]}>
      {({ user }) => (
        <AppShell user={user} nav={STUDENT_NAV} title={title}>
          {children}
        </AppShell>
      )}
    </RouteGuard>
  );
}
