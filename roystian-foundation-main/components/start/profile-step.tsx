"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, LogIn } from "lucide-react";
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
import { EDUCATION_LEVELS } from "@/data/content";
import { getDraft, saveDraft } from "@/lib/onboarding";
import { useSession } from "@/lib/auth";
import { delay } from "@/lib/api";
import type { EducationLevel, ExperienceLevel, ProgramId } from "@/types";
import { getDomain } from "@/data/domains";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  mobile: z
    .string()
    .min(8, "Enter a valid mobile number.")
    .max(18, "Enter a valid mobile number."),
  educationLevel: z.string().min(1, "Select your education level."),
  college: z.string().min(2, "Enter your college or institution."),
  course: z.string().min(2, "Enter your course or degree."),
  city: z.string().min(2, "Enter your city."),
});

type FormValues = z.infer<typeof schema>;

const FIELDS: {
  id: keyof FormValues;
  label: string;
  placeholder: string;
  type: string;
  autoComplete?: string;
  full?: boolean;
}[] = [
  {
    id: "fullName",
    label: "Full Name",
    placeholder: "Rahul Sharma",
    type: "text",
    autoComplete: "name",
  },
  {
    id: "email",
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
    autoComplete: "email",
  },
  {
    id: "mobile",
    label: "Mobile",
    placeholder: "+91 90000 00000",
    type: "tel",
    autoComplete: "tel",
  },
  { id: "city", label: "City", placeholder: "Pune", type: "text" },
  {
    id: "college",
    label: "College / Institution",
    placeholder: "Institute of Technology",
    type: "text",
    full: true,
  },
  {
    id: "course",
    label: "Course / Degree",
    placeholder: "B.Tech Computer Engineering",
    type: "text",
    full: true,
  },
];

export function ProfileStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { student } = useSession();
  const [ready, setReady] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      educationLevel: "",
      college: "",
      course: "",
      city: "",
    },
  });

  // Hydrate from the saved draft, the signed-in student, and any deep-link params.
  React.useEffect(() => {
    const draft = getDraft();
    const domainParam = searchParams.get("domain");
    const programParam = searchParams.get("program");
    const patch: Record<string, unknown> = {};
    if (domainParam && getDomain(domainParam)) patch.domainId = domainParam;
    if (programParam === "self-paced" || programParam === "industry-led") {
      patch.programId = programParam as ProgramId;
    }
    if (Object.keys(patch).length) saveDraft(patch);

    reset({
      fullName: draft.fullName || student?.name || "",
      email: draft.email || student?.email || "",
      mobile: draft.mobile || student?.mobile || "",
      educationLevel: draft.educationLevel || student?.educationLevel || "",
      college: draft.college || student?.college || "",
      course: draft.course || student?.course || "",
      city: draft.city || student?.city || "",
    });
    setReady(true);
  }, [reset, searchParams, student]);

  async function onSubmit(values: FormValues) {
    await delay(350);
    const draft = getDraft();
    saveDraft({
      ...values,
      educationLevel: values.educationLevel as EducationLevel,
      domainId: draft.domainId,
      experience: draft.experience as ExperienceLevel | null,
      programId: draft.programId,
    });
    router.push("/start/domain");
  }

  if (!ready) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">Loading your details…</span>
        <div className="skeleton h-11 w-full rounded-lg" />
        <div className="skeleton h-11 w-full rounded-lg" />
        <div className="skeleton h-11 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!student && (
        <div className="flex flex-col gap-3.5 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LogIn className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Already have an account?
              </p>
              <p className="text-xs text-muted-foreground">
                Sign in to prefill your details and access your existing internship.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/login?next=/start">Log In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
      >
      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.id} className={field.full ? "sm:col-span-2" : undefined}>
            <Label htmlFor={field.id} className="mb-2 block">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              aria-invalid={Boolean(errors[field.id])}
              {...register(field.id)}
            />
            {errors[field.id] && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors[field.id]?.message}
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
            <SelectTrigger id="educationLevel" aria-invalid={Boolean(errors.educationLevel)}>
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
      </div>

      <div className="mt-7 flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Your details are saved locally so you can return to this step at any time.
        </p>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              Continue to domain <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </form>
    </div>
  );
}
