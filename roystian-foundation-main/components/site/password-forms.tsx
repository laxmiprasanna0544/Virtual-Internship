"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { CARD, FormError } from "@/components/account/confirm-email-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resetPassword } from "@/lib/auth";

/*
 * Password reset is code-based: we email a 6-digit code, which is
 * entered here with the new password. There are no reset links.
 */

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
      <ResetPasswordForm
        initialEmail={sentTo}
        intro={
          <>
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
            a 6-digit code is on its way. Enter it below with your new password.
          </>
        }
      />
    );
  }

  return (
    <form
      noValidate
      className={CARD}
      onSubmit={handleSubmit(async ({ email }) => {
        await requestPasswordReset(email);
        setSentTo(email.trim().toLowerCase());
      })}
    >
      <h1 className="font-display text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the email address you signed up with. We will email you a code.
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
        {isSubmitting ? <Loader2 className="animate-spin" /> : <MailCheck />} Send reset code
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have a code?{" "}
        <Link href="/reset-password" className="font-medium text-primary hover:underline">
          Enter it
        </Link>{" "}
        · Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

const resetSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .regex(/[a-z]/, "Include a lower case letter.")
      .regex(/[A-Z]/, "Include an upper case letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm({
  initialEmail,
  intro,
}: {
  initialEmail?: string;
  intro?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: initialEmail ?? searchParams.get("email") ?? "",
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const fields = [
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "code", label: "6-digit code", type: "text", autoComplete: "one-time-code" },
    { name: "password", label: "New password", type: "password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm new password", type: "password", autoComplete: "new-password" },
  ] as const;

  return (
    <form
      noValidate
      className={CARD}
      onSubmit={handleSubmit(async ({ email, code, password }) => {
        setServerError(null);
        const result = await resetPassword(email, code, password);
        if (!result.ok) {
          setServerError(result.error ?? "Could not reset the password.");
          return;
        }
        toast.success("Password updated. Sign in with your new password.");
        router.push("/login");
      })}
    >
      <h1 className="font-display text-xl font-semibold text-foreground">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {intro ?? "Enter the code from the reset email and your new password."}
      </p>
      <FormError message={serverError} />
      <div className="mt-6 space-y-5">
        {fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="mb-2 block">
              {field.label}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              {...(field.name === "code" ? { inputMode: "numeric" as const, maxLength: 6 } : {})}
              aria-invalid={Boolean(errors[field.name])}
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors[field.name]?.message}
              </p>
            ) : field.name === "password" ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                At least 10 characters, with upper and lower case letters and a number.
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />} Update password
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        No code?{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Send a new one
        </Link>
      </p>
    </form>
  );
}
