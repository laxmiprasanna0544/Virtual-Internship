"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmEmailStep } from "@/components/account/confirm-email-step";
import { login, registerStudent } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import { EDUCATION_LEVELS } from "@/data/content";
import type { EducationLevel } from "@/types";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    mobile: z.string().min(8, "Enter a valid mobile number."),
    college: z.string().min(2, "Enter your college or institution."),
    course: z.string().min(2, "Enter your course or degree."),
    city: z.string().min(2, "Enter your city."),
    educationLevel: z.string().min(1, "Select your education level."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .regex(/[a-z]/, "Include a lower case letter.")
      .regex(/[A-Z]/, "Include an upper case letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeNext(searchParams.get("next"));
  const [serverError, setServerError] = React.useState<string | null>(null);
  // Held in memory only, to sign in straight after the email is confirmed.
  const [pending, setPending] = React.useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      college: "",
      course: "",
      city: "",
      educationLevel: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await registerStudent({
      name: values.name,
      email: values.email,
      password: values.password,
      mobile: values.mobile,
      college: values.college,
      course: values.course,
      city: values.city,
      educationLevel: values.educationLevel as EducationLevel,
    });
    if (!result.ok) {
      setServerError(result.error ?? "Unable to create the account.");
      return;
    }
    setPending({ email: values.email, password: values.password });
  }

  async function signInAfterConfirm() {
    if (!pending) return;
    const result = await login(pending.email, pending.password);
    if (!result.ok || !result.user) {
      toast.success("Email confirmed. Sign in to continue.");
      router.push(redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login");
      return;
    }
    toast.success("Account created", {
      description: redirectTo ? undefined : "Choose a domain to start your internship.",
    });
    router.push(redirectTo ?? (result.user.role === "student" ? "/start" : homeForRole(result.user.role)));
  }

  if (pending) {
    return <ConfirmEmailStep email={pending.email} onConfirmed={signInAfterConfirm} />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <h1 className="font-display text-xl font-semibold text-foreground">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        You need an account to complete checkout. Your onboarding choices are kept
        while you sign up.
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

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {[
          { id: "name", label: "Full Name", placeholder: "Rahul Sharma", type: "text" },
          { id: "email", label: "Email", placeholder: "you@example.com", type: "email" },
          { id: "mobile", label: "Mobile", placeholder: "+91 90000 00000", type: "tel" },
          { id: "city", label: "City", placeholder: "Pune", type: "text" },
          {
            id: "college",
            label: "College / Institution",
            placeholder: "Institute of Technology",
            type: "text",
          },
          {
            id: "course",
            label: "Course / Degree",
            placeholder: "B.Tech Computer Engineering",
            type: "text",
          },
        ].map((field) => (
          <div key={field.id}>
            <Label htmlFor={field.id} className="mb-2 block">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              aria-invalid={Boolean(errors[field.id as keyof FormValues])}
              {...register(field.id as keyof FormValues)}
            />
            {errors[field.id as keyof FormValues] && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors[field.id as keyof FormValues]?.message as string}
              </p>
            )}
          </div>
        ))}

        <div className="sm:col-span-2">
          <Label htmlFor="educationLevel" className="mb-2 block">
            Education Level
          </Label>
          <Select
            value={watch("educationLevel")}
            onValueChange={(value) =>
              setValue("educationLevel", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="educationLevel">
              <SelectValue placeholder="Select your education level" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.educationLevel && (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.educationLevel.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              At least 10 characters, with upper and lower case letters and a number.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="mb-2 block">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Creating account…
          </>
        ) : (
          <>
            <UserPlus /> Create account
          </>
        )}
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login"}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
