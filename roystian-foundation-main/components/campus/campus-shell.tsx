"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutGrid,
  LogOut,
  Menu,
  TrendingDown,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme";
import { PageTransition } from "@/components/motion/page-transition";
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
import { RouteGuard } from "@/components/dashboard/guard";
import { logout } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";

const CAMPUS_NAV = [
  { href: "/campus", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/campus/students", label: "Students", icon: Users },
  { href: "/campus/skill-gap", label: "Skill Gap Report", icon: TrendingDown },
];

/**
 * The Roystian Campus Dashboard shell.
 *
 * Deliberately a separate surface from the admin console: a placement officer
 * sees only their own institution's cohort, never the whole platform.
 */
export function CampusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <RouteGuard allow={["college", "admin"]}>
      {({ user }) => (
        <div className="flex min-h-screen bg-muted/25">
          <aside className="no-print sticky top-0 hidden h-screen w-[16.5rem] shrink-0 flex-col border-r border-border bg-background lg:flex">
            <div className="flex h-16 items-center border-b border-border px-5">
              <Logo href="/campus" />
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Campus navigation">
              <ul className="space-y-0.5">
                {CAMPUS_NAV.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/8 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon
                          className="h-[1.05rem] w-[1.05rem] shrink-0"
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
              <p className=" text-[0.7rem] leading-relaxed text-muted-foreground">
                Figures are computed live from your cohort.
              </p>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
              <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  {mobileOpen ? <X /> : <Menu />}
                </Button>

                <div className="lg:hidden">
                  <Logo href="/campus" compact />
                </div>

                <p className="ml-1 hidden items-center gap-2 text-sm font-semibold text-foreground lg:flex">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Campus Dashboard
                </p>

                <div className="ml-auto flex items-center gap-1">
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted"
                        aria-label="Account menu"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="hidden max-w-[12rem] truncate text-sm font-medium text-foreground sm:block">
                          {user.name}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logout();
                          router.push("/login");
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {mobileOpen && (
                <nav className="border-t border-border p-3 lg:hidden">
                  <ul className="space-y-0.5">
                    {CAMPUS_NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <item.icon className="h-4 w-4" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </header>

            <main className="flex-1 px-4 py-7 sm:px-6 lg:px-8">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}
