"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, MailCheck, UserPlus } from "lucide-react";
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
import { registerStudent } from "@/lib/auth";
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
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/** Only same-origin paths are honoured, so `next` cannot redirect off-site. */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeNext(searchParams.get("next"));
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = React.useState<string | null>(null);

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
    if (result.needsConfirmation) {
      setConfirmEmail(values.email);
      return;
    }
    toast.success("Account created", {
      description: redirectTo ? undefined : "Choose a domain to start your internship.",
    });
    router.push(redirectTo ?? "/start");
  }

  if (confirmEmail) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
      >
        <MailCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
          Confirm your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{confirmEmail}</span>. Open it to
          activate your account, then sign in.
        </p>
      </div>
    );
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
          {errors.password && (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              {errors.password.message}
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
