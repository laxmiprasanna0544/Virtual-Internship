"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/data/content";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { useStudentContext } from "@/lib/use-student";
import { logout, updateOwnProfile } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/utils";
import type { EducationLevel } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  mobile: z.string().min(8, "Enter a valid mobile number."),
  college: z.string().min(2, "Enter your college or institution."),
  course: z.string().min(2, "Enter your course or degree."),
  city: z.string().min(2, "Enter your city."),
  educationLevel: z.string().min(1, "Select your education level."),
});

type FormValues = z.infer<typeof schema>;

export function ProfileView() {
  const ctx = useStudentContext();
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);

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
      name: "",
      email: "",
      mobile: "",
      college: "",
      course: "",
      city: "",
      educationLevel: "",
    },
  });

  React.useEffect(() => {
    if (ctx.ready && ctx.student && !hydrated) {
      reset({
        name: ctx.student.name,
        email: ctx.student.email,
        mobile: ctx.student.mobile,
        college: ctx.student.college,
        course: ctx.student.course,
        city: ctx.student.city,
        educationLevel: ctx.student.educationLevel,
      });
      setHydrated(true);
    }
  }, [ctx.ready, ctx.student, hydrated, reset]);

  if (!ctx.ready || !ctx.student) return <LoadingState label="Loading profile" rows={3} />;

  const { student, domain, program, registration, registrations } = ctx;

  async function onSubmit(values: FormValues) {
    const result = await updateOwnProfile({
      name: values.name,
      email: values.email,
      mobile: values.mobile,
      college: values.college,
      course: values.course,
      city: values.city,
      educationLevel: values.educationLevel as EducationLevel,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Unable to save your profile.");
      return;
    }
    toast.success("Profile updated", {
      description: result.emailChangePending
        ? "Check your new inbox to confirm the email change."
        : undefined,
    });
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your details appear on your certificate, so keep them accurate."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Personal details
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {[
              { id: "name", label: "Full Name", type: "text" },
              { id: "email", label: "Email", type: "email" },
              { id: "mobile", label: "Mobile", type: "tel" },
              { id: "city", label: "City", type: "text" },
              { id: "college", label: "College / Institution", type: "text", full: true },
              { id: "course", label: "Course / Degree", type: "text", full: true },
            ].map((field) => (
              <div key={field.id} className={field.full ? "sm:col-span-2" : undefined}>
                <Label htmlFor={field.id} className="mb-2 block">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
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
            </div>
          </div>

          <Button type="submit" className="mt-6" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save /> Save changes
              </>
            )}
          </Button>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Enrollment
            </h2>
            <dl className="mt-4 space-y-3.5 text-sm">
              {[
                { label: "Registration ID", value: student.registrationId ?? "—", mono: true },
                { label: "Domain", value: domain?.name ?? "—" },
                { label: "Program", value: program?.name ?? "—" },
                {
                  label: "Experience",
                  value:
                    EXPERIENCE_LEVELS.find((e) => e.value === student.experience)?.label ??
                    "—",
                },
                {
                  label: "Amount paid",
                  value: registration ? formatINR(registration.amount) : "—",
                },
                { label: "Start date", value: formatDate(registration?.startDate) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 border-b border-border pb-3.5 last:border-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd
                    className={`text-right font-medium text-foreground ${row.mono ? "font-mono text-xs" : ""}`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={student.status} />
                </dd>
              </div>
            </dl>

            {!student.domainId && (
              <Button asChild className="mt-4 w-full">
                <Link href="/start">Start an internship</Link>
              </Button>
            )}
          </section>

          {registrations.length > 1 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Purchase History
              </h2>
              <ul className="mt-4 space-y-3">
                {registrations.map((reg) => {
                  const regDomain = getDomain(reg.domainId);
                  const regProgram = getProgram(reg.programId);
                  const active = reg.id === student.registrationId;
                  return (
                    <li
                      key={reg.id}
                      className="rounded-xl border border-border px-3.5 py-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-foreground">
                          {regDomain?.name ?? reg.domainId}
                        </span>
                        <StatusBadge status={active ? "active" : "completed"} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {regProgram?.name ?? "—"} · {formatINR(reg.amount)} ·{" "}
                        {formatDate(reg.createdAt)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {reg.id}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Account
            </h2>
            <div className="mt-4 space-y-2.5">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut /> Logout
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
