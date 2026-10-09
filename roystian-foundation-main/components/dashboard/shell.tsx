"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardList,
  Compass,
  FileSignature,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  HeartHandshake,
  IdCard,
  LayoutGrid,
  Linkedin,
  LogOut,
  Medal,
  Menu,
  MessagesSquare,
  Swords,
  Trophy,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { PageTransition } from "@/components/motion/page-transition";
import { ThemeToggle } from "@/components/shared/theme";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DemoBadge } from "@/components/shared/demo-banner";
import { logout } from "@/lib/auth";
import { EASE } from "@/lib/motion";
import { cn, initials } from "@/lib/utils";
import type { Student, User } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Items are grouped so the sidebar stays legible as the platform grows. */
  group?: string;
}

export const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },

  // Learn — the internship itself.
  { href: "/dashboard/internship", label: "My Internship", icon: GraduationCap, group: "Learn" },
  { href: "/dashboard/domains", label: "Explore & Enroll", icon: Compass, group: "Learn" },
  { href: "/dashboard/learning", label: "Learning", icon: BookOpen, group: "Learn" },
  { href: "/dashboard/assignments", label: "Assignments", icon: FileText, group: "Learn" },
  { href: "/dashboard/assessments", label: "Assessments", icon: ClipboardList, group: "Learn" },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays, group: "Learn" },

  // Build & prove — the evidence the V2 platform is organised around.
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban, group: "Build & Prove" },
  { href: "/dashboard/readiness", label: "Career Readiness", icon: Gauge, group: "Build & Prove" },
  { href: "/dashboard/badges", label: "Skill Badges", icon: Trophy, group: "Build & Prove" },
  { href: "/dashboard/passport", label: "Career Passport", icon: IdCard, group: "Build & Prove" },
  { href: "/dashboard/certificate", label: "Certificate", icon: Award, group: "Build & Prove" },

  // Prepare — the career tooling.
  { href: "/dashboard/resume", label: "Resume", icon: FileSignature, group: "Prepare" },
  { href: "/dashboard/linkedin", label: "LinkedIn", icon: Linkedin, group: "Prepare" },
  { href: "/dashboard/interview", label: "Mock Interviews", icon: MessagesSquare, group: "Prepare" },
  { href: "/dashboard/assistant", label: "Career Assistant", icon: Bot, group: "Prepare" },

  // Opportunities — what performance unlocks.
  { href: "/dashboard/challenges", label: "Challenges", icon: Swords, group: "Opportunities" },
  { href: "/dashboard/fellowship", label: "Fellowship", icon: Medal, group: "Opportunities" },
  { href: "/dashboard/scholarship", label: "Scholarship", icon: HeartHandshake, group: "Opportunities" },

  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

/**
 * The mobile bar only has room for five. These are the highest-traffic
 * destinations — readiness replaces the certificate because it is the surface
 * students return to most once the V2 career system is in play.
 */
const MOBILE_NAV = STUDENT_NAV.filter((item) =>
  [
    "/dashboard",
    "/dashboard/learning",
    "/dashboard/projects",
    "/dashboard/readiness",
    "/dashboard/profile",
  ].includes(item.href),
);

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppShell({
  user,
  nav,
  homeHref = "/dashboard",
  title,
  children,
}: {
  user: User | Student;
  nav: NavItem[];
  homeHref?: string;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const mobileItems = nav === STUDENT_NAV ? MOBILE_NAV : nav.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-muted/25">
      {/* Sidebar — desktop */}
      <aside className="no-print sticky top-0 hidden h-screen w-[16.5rem] shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href={homeHref} />
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label={`${title} navigation`}>
          <ul className="space-y-0.5">
            {nav.map((item, index) => {
              const active = isActive(pathname, item);
              // A heading is printed whenever the group changes, so the list
              // reads as sections rather than one long run of links.
              const showGroup =
                Boolean(item.group) && item.group !== nav[index - 1]?.group;
              return (
                <li key={item.href}>
                  {showGroup && (
                    <p className="eyebrow px-3 pb-1.5 pt-4 text-[0.63rem]">
                      {item.group}
                    </p>
                  )}
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 -z-10 rounded-lg bg-primary/8"
                        transition={{ duration: 0.3, ease: EASE }}
                        aria-hidden="true"
                      />
                    )}
                    <item.icon
                      className="h-[1.05rem] w-[1.05rem] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border p-4">
          <DemoBadge />
          <p className="mt-2.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            Data is stored in your browser only.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>

            <div className="lg:hidden">
              <Logo href={homeHref} compact />
            </div>

            <p className="ml-1 hidden text-sm font-semibold text-foreground lg:block">
              {title}
            </p>

            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium text-foreground sm:block">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.role === "student" ? "/dashboard/profile" : "/admin/settings"}>
                      <UserRound /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "student" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/domains">
                        <Compass /> Explore Domains
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <LayoutGrid /> Public site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile drawer */}
          <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.nav
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden border-t border-border bg-background px-3 py-3 lg:hidden"
              aria-label="Mobile navigation"
            >
              <ul className="space-y-0.5">
                {nav.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                          active
                            ? "bg-primary/8 text-primary"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          )}
          </AnimatePresence>
        </header>

        <main id="main" className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        {/* Bottom nav — mobile */}
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
          aria-label="Quick navigation"
        >
          <ul className="grid grid-cols-5">
            {mobileItems.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 py-2 text-[0.65rem] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span className="relative flex h-6 w-11 items-center justify-center">
                      {active && (
                        <motion.span
                          layoutId="bottom-nav-active"
                          className="absolute inset-0 rounded-full bg-primary/10"
                          transition={{ duration: 0.3, ease: EASE }}
                          aria-hidden="true"
                        />
                      )}
                      <item.icon
                        className="relative h-[1.15rem] w-[1.15rem]"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="max-w-full truncate px-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
