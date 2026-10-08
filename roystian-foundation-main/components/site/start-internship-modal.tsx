"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, LogIn, Sparkles, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth";

export function StartInternshipModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  function handleCreateAccount() {
    onOpenChange(false);
    router.push("/register");
  }

  function handleLogin() {
    onOpenChange(false);
    router.push("/login?next=/dashboard");
  }

  function handleQuickStart() {
    onOpenChange(false);
    router.push("/start");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:p-7">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="font-display text-xl font-semibold">
                Start Your Internship
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Roystian Foundation Virtual Internship Programme
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose an option below to continue to your internship application or dashboard:
        </p>

        <div className="mt-4 grid gap-3.5">
          {/* Create Account Option */}
          <button
            type="button"
            onClick={handleCreateAccount}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <UserPlus className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-foreground group-hover:text-primary">
                  Create Account
                </span>
                <Badge variant="default" className="px-2 py-0 text-[0.65rem]">
                  New Student
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Set up a new student account to choose your domain, track, and begin your internship.
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>

          {/* Login Option */}
          <button
            type="button"
            onClick={handleLogin}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <LogIn className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-foreground group-hover:text-primary">
                  Log In
                </span>
                <Badge variant="secondary" className="px-2 py-0 text-[0.65rem]">
                  Existing Student
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Already registered? Sign in to access your modules, submit assessments, and view your certificate.
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        </div>

        {/* Guest / Onboarding fallback */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
          <span>Or proceed directly to onboarding:</span>
          <button
            type="button"
            onClick={handleQuickStart}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Continue as Guest <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StartInternshipButton({
  children,
  className,
  size,
  variant,
}: {
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}) {
  const [open, setOpen] = React.useState(false);
  const { ready, user } = useSession();
  const router = useRouter();

  function handleClick() {
    if (ready && user) {
      router.push("/dashboard");
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={handleClick}
      >
        {children ?? (
          <>
            Start Internship <ArrowRight className="cta-arrow" />
          </>
        )}
      </Button>
      <StartInternshipModal open={open} onOpenChange={setOpen} />
    </>
  );
}
