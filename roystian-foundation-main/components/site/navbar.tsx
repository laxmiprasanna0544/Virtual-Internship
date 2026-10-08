"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme";
import { Button } from "@/components/ui/button";
import { StartInternshipModal } from "@/components/site/start-internship-modal";
import { useSession } from "@/lib/auth";
import { isBleedRoute } from "@/lib/routes";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { NAV_GROUPS, type NavGroup } from "@/components/site/nav-config";

export function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [startModalOpen, setStartModalOpen] = React.useState(false);
  const { ready, user } = useSession();

  const overHero = isBleedRoute(pathname);
  /** Transparent only while the bar is still sitting on the hero image. */
  const transparent = overHero && !scrolled && !open;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dashboardHref = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <>
      <header
        data-transparent={transparent ? "true" : "false"}
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500",
          transparent && "border-transparent bg-transparent text-white",
          !transparent &&
            (open
              ? // Solid while the drawer is open — nothing should show through.
                "border-border bg-background"
              : "border-border bg-background/85 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"),
        )}
      >
        <div
          className={cn(
            "container flex items-center justify-between gap-4 transition-[height] duration-500",
            // The open drawer is anchored at 3.75rem, so the bar condenses with it.
            scrolled || open ? "h-[3.75rem]" : "h-16 lg:h-[4.75rem]",
          )}
        >
          <Logo className={transparent ? "[&_span]:text-white" : undefined} />

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Primary navigation"
          >
            {NAV_GROUPS.map((group) => (
              <NavGroupItem
                key={group.label}
                group={group}
                pathname={pathname}
                transparent={transparent}
              />
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle
              className={cn(
                "hidden sm:inline-flex",
                transparent && "text-white hover:bg-white/10 hover:text-white",
              )}
            />
            {ready && user ? (
              <Button
                asChild
                size="sm"
                className={cn(
                  "group hidden sm:inline-flex",
                  transparent && "bg-white text-ink-surface hover:bg-white/90",
                )}
              >
                <Link href={dashboardHref}>
                  <LayoutDashboard /> Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "hidden sm:inline-flex",
                    transparent && "text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Link href="/login">Login</Link>
                </Button>
                {/*
                  Self-registration has to be reachable from the homepage, not
                  only via Login → "Create an account", so a new visitor can
                  follow Homepage → Create Account → Register → Login.
                */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hidden sm:inline-flex",
                    transparent &&
                      "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStartModalOpen(true)}
                  className={cn(
                    "group hidden sm:inline-flex",
                    transparent && "bg-white text-ink-surface hover:bg-white/90",
                  )}
                >
                  Start Internship <ArrowRight className="cta-arrow" />
                </Button>
              </>
            )}

            <MenuButton
              open={open}
              transparent={transparent}
              onClick={() => setOpen((v) => !v)}
            />
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="fixed inset-0 top-[3.75rem] z-40 overflow-y-auto border-t border-border bg-background px-5 pb-12 pt-6 lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {NAV_GROUPS.map((group, index) => (
                <motion.div
                  key={group.label}
                  initial={reduce ? undefined : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.04 + index * 0.045,
                    ease: EASE,
                  }}
                  className="border-b border-border py-4"
                >
                  <Link
                    href={group.href}
                    className="flex items-center justify-between font-display text-lg font-semibold text-foreground"
                  >
                    {group.label}
                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                  {group.children && (
                    <div className="mt-2.5 flex flex-col gap-1.5 pl-0.5">
                      {group.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-[0.86rem] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.32, ease: EASE }}
              className="mt-7 flex flex-col gap-2.5"
            >
              {ready && user ? (
                <Button asChild size="lg">
                  <Link href={dashboardHref}>Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => {
                      setOpen(false);
                      setStartModalOpen(true);
                    }}
                  >
                    Start My Internship
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/register">Create Account</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Login</Link>
                  </Button>
                </>
              )}
              <div className="mt-2 flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <StartInternshipModal open={startModalOpen} onOpenChange={setStartModalOpen} />
    </>
  );
}

/** Three bars that fold into a cross. */
function MenuButton({
  open,
  transparent,
  onClick,
}: {
  open: boolean;
  transparent: boolean;
  onClick: () => void;
}) {
  const bar = cn(
    "absolute left-0 h-[1.5px] w-5 rounded-full transition-all duration-300",
    transparent ? "bg-white" : "bg-foreground",
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="mobile-menu"
      className={cn(
        "relative -mr-1 flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden",
        transparent ? "hover:bg-white/10" : "hover:bg-muted",
      )}
    >
      <span className="relative block h-3.5 w-5" aria-hidden="true">
        <span className={cn(bar, open ? "top-[6px] rotate-45" : "top-0")} />
        <span
          className={cn(
            bar,
            "top-[6px]",
            open ? "opacity-0" : "opacity-100",
          )}
        />
        <span className={cn(bar, open ? "top-[6px] -rotate-45" : "top-[12px]")} />
      </span>
    </button>
  );
}

/**
 * A top-level nav group. Opens its dropdown on hover and on focus, so the
 * menu is reachable by keyboard as well as pointer.
 */
function NavGroupItem({
  group,
  pathname,
  transparent,
}: {
  group: NavGroup;
  pathname: string;
  transparent: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  const active =
    pathname === group.href ||
    pathname.startsWith(`${group.href}/`) ||
    (group.children ?? []).some((c) => pathname === c.href.split("#")[0]);

  // A short close delay stops the menu vanishing while the pointer travels
  // from the trigger down into the panel.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  React.useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (!group.children?.length) {
    return (
      <Link
        href={group.href}
        className={cn(
          "relative rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors",
          transparent
            ? active
              ? "text-white"
              : "text-white/75 hover:text-white"
            : active
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        {group.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        setOpen(true);
      }}
      onBlur={scheduleClose}
    >
      <Link
        href={group.href}
        aria-expanded={open}
        className={cn(
          "relative flex items-center gap-1 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors",
          transparent
            ? active
              ? "text-white"
              : "text-white/75 hover:text-white"
            : active
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
        {active && (
          <motion.span
            layoutId="nav-active"
            className={cn(
              "absolute inset-x-3 -bottom-px h-px",
              transparent ? "bg-white" : "bg-primary",
            )}
            transition={{ duration: 0.35, ease: EASE }}
          />
        )}
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute left-0 top-full z-50 w-[19rem] pt-2"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-background p-1.5 shadow-lift">
              {group.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="block text-[0.86rem] font-semibold text-foreground">
                    {child.label}
                  </span>
                  {child.description && (
                    <span className="mt-0.5 block text-[0.76rem] leading-snug text-muted-foreground">
                      {child.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
