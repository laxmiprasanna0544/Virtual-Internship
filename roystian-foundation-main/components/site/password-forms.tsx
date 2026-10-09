"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, KeyRound, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, updatePassword } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8";

const emailSchema = z.object({ email: z.string().email("Enter a valid email address.") });

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  if (sentTo) {
    return (
      <div role="status" className={CARD}>
        <MailCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
          a link to reset the password is on its way. It expires in one hour.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={CARD}
      onSubmit={handleSubmit(async ({ email }) => {
        await requestPasswordReset(email);
        setSentTo(email);
      })}
    >
      <h1 className="font-display text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the email address you signed up with.
      </p>
      <div className="mt-6">
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <MailCheck />} Send reset link
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  if (hasSession === null) {
    return (
      <div className={CARD} role="status">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className={CARD} role="alert">
        <h1 className="font-display text-xl font-semibold text-foreground">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is invalid or has already been used.
        </p>
        <Button asChild className="mt-6">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={CARD}
      onSubmit={handleSubmit(async ({ password }) => {
        setServerError(null);
        const result = await updatePassword(password);
        if (!result.ok) {
          setServerError(result.error ?? "Could not update the password.");
          return;
        }
        toast.success("Password updated");
        router.push("/dashboard");
      })}
    >
      <h1 className="font-display text-xl font-semibold text-foreground">Choose a new password</h1>
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
        {(
          [
            ["password", "New password"],
            ["confirmPassword", "Confirm new password"],
          ] as const
        ).map(([name, label]) => (
          <div key={name}>
            <Label htmlFor={name} className="mb-2 block">
              {label}
            </Label>
            <Input
              id={name}
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors[name])}
              {...register(name)}
            />
            {errors[name] && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />} Update password
      </Button>
    </form>
  );
}
