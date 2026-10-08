"use client";

import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutGrid,
  Layers,
  MessagesSquare,
  Receipt,
  Settings,
  Trophy,
  Users,
  UserCog,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/dashboard/shell";
import { RouteGuard } from "@/components/dashboard/guard";

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/registrations", label: "Registrations", icon: Receipt },
  { href: "/admin/programs", label: "Programs", icon: Layers },
  { href: "/admin/domains", label: "Domains", icon: Building2 },
  { href: "/admin/trainers", label: "Trainers", icon: UserCog },
  { href: "/admin/assignments", label: "Assignments", icon: FileText },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/opportunities", label: "Opportunities", icon: Trophy },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/communications", label: "Communications", icon: MessagesSquare },
  { href: "/admin/leads", label: "College Leads", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const TRAINER_ALLOWED = new Set([
  "/admin",
  "/admin/students",
  "/admin/assignments",
  "/admin/projects",
  "/admin/trainers",
  "/admin/settings",
]);

const TRAINER_NAV = ADMIN_NAV.filter((item) => TRAINER_ALLOWED.has(item.href));

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Longest match wins so /admin/analytics reads "Analytics", not "Overview".
  const match = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

  return (
    <RouteGuard allow={["admin", "trainer"]}>
      {({ user }) => (
        <AppShell
          user={user}
          nav={user.role === "trainer" ? TRAINER_NAV : ADMIN_NAV}
          homeHref="/admin"
          title={`${user.role === "trainer" ? "Trainer" : "Admin"} · ${match?.label ?? "Overview"}`}
        >
          {children}
        </AppShell>
      )}
    </RouteGuard>
  );
}
