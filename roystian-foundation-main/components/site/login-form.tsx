"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Handshake,
  LogIn,
  Loader2,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/shared/demo-banner";
import { DEMO_ACCOUNTS, login } from "@/lib/auth";
import { delay } from "@/lib/api";
import type { Role } from "@/types";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

const ROLE_ICON: Record<Role, typeof UserRound> = {
  student: UserRound,
  admin: ShieldCheck,
  trainer: Wrench,
  college: Building2,
  partner: Handshake,
};

function destinationFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "trainer") return "/admin/trainers";
  if (role === "college") return "/campus";
  if (role === "partner") return "/partner";
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [quickBusy, setQuickBusy] = React.useState<Role | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    await delay(500);
    const result = login(values.email, values.password);
    if (!result.ok || !result.user) {
      setServerError(result.error ?? "Unable to sign in.");
      return;
    }
    toast.success(`Welcome back, ${result.user.name.split(" ")[0]}`);
    router.push(redirectTo ?? destinationFor(result.user.role));
  }

  async function quickLogin(role: Role) {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!account) return;
    setQuickBusy(role);
    setServerError(null);
    setValue("email", account.email);
    setValue("password", account.password);
    await delay(400);
    const result = login(account.email, account.password);
    setQuickBusy(null);
    if (!result.ok || !result.user) {
      setServerError(result.error ?? "Unable to sign in.");
      return;
    }
    toast.success(`Signed in as ${account.label}`);
    router.push(redirectTo ?? destinationFor(role));
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <div>
        <DemoBadge />
        <h1 className="h2 mt-5">Welcome back.</h1>
        <p className="lede mt-3">
          Sign in to continue your internship, or use one of the demo accounts to
          explore the full product immediately.
        </p>

        <div className="mt-8 space-y-3">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = ROLE_ICON[account.role];
            return (
              <div
                key={account.email}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {account.label}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {account.email} · {account.password}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {account.description}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={account.role === "student" ? "default" : "outline"}
                  className="shrink-0"
                  onClick={() => quickLogin(account.role)}
                  disabled={quickBusy !== null}
                >
                  {quickBusy === account.role ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogIn />
                  )}
                  Login as {account.role === "student" ? "Demo Student" : account.role === "admin" ? "Demo Admin" : "Demo Trainer"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">Login</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your email address and password.
          </p>

          {serverError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-11"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn /> Sign in
              </>
            )}
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>{" "}
            or{" "}
            <Link href="/start" className="font-medium text-primary hover:underline">
              start an internship
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
