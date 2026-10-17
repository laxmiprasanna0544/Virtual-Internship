"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, LogIn, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmEmailStep, CARD, CodeField, FormError } from "@/components/account/confirm-email-step";
import { login, submitMfaCode, type LoginResult } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeNext(searchParams.get("next"));
  const [serverError, setServerError] = React.useState<string | null>(
    searchParams.get("error") === "suspended"
      ? "This account is suspended. Contact the programme team."
      : null,
  );
  const [showPassword, setShowPassword] = React.useState(false);
  // Second steps: an authenticator code, or confirming the email address.
  const [step, setStep] = React.useState<"password" | "mfa" | "confirm">("password");
  const [credentials, setCredentials] = React.useState<FormValues | null>(null);
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaBusy, setMfaBusy] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function finish(result: LoginResult) {
    if (!result.ok || !result.user) {
      setServerError(result.error ?? "Unable to sign in.");
      return;
    }
    toast.success(`Welcome back, ${result.user.name.split(" ")[0]}`);
    if (result.mfaSetupRequired) {
      router.push("/account/security?required=1");
      return;
    }
    router.push(redirectTo ?? homeForRole(result.user.role));
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await login(values.email, values.password);
    setCredentials(values);
    if (result.mfaRequired) {
      setStep("mfa");
      return;
    }
    if (result.needsConfirmation) {
      setStep("confirm");
      return;
    }
    finish(result);
  }

  async function onMfaSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(mfaCode)) {
      setServerError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setMfaBusy(true);
    setServerError(null);
    const result = await submitMfaCode(mfaCode);
    setMfaBusy(false);
    if (!result.ok && /timed out/i.test(result.error ?? "")) {
      setStep("password");
      setMfaCode("");
    }
    finish(result);
  }

  const intro = (
    <div>
      <h1 className="h2">Welcome back.</h1>
      <p className="lede mt-3">
        Sign in to continue your internship, track your progress and access your
        certificate.
      </p>
    </div>
  );

  if (step === "confirm" && credentials) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        {intro}
        <ConfirmEmailStep
          email={credentials.email}
          onConfirmed={async () => {
            setStep("password");
            await onSubmit(credentials);
          }}
        />
      </div>
    );
  }

  if (step === "mfa") {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        {intro}
        <form onSubmit={onMfaSubmit} noValidate className={CARD}>
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
            Two-factor authentication
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
          <FormError message={serverError} />
          <div className="mt-6">
            <CodeField value={mfaCode} onChange={setMfaCode} label="Authenticator code" />
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={mfaBusy}>
            {mfaBusy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Verify and sign in
          </Button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setStep("password");
                setMfaCode("");
                setServerError(null);
              }}
            >
              Use a different account
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
      {intro}

      <div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">Sign in</h2>
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
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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
            <Link
              href={redirectTo ? `/register?next=${encodeURIComponent(redirectTo)}` : "/register"}
              className="font-medium text-primary hover:underline"
            >
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
