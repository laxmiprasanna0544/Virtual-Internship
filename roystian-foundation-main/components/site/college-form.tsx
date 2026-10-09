"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLead } from "@/lib/leads";
import type { InstitutionType } from "@/types";
import { COLLEGE_OFFERINGS } from "@/data/content";
import { toast } from "sonner";

const schema = z.object({
  collegeName: z.string().min(2, "Enter the college or institution name."),
  city: z.string().min(2, "Enter the city."),
  state: z.string().min(1, "Select the state."),
  institutionType: z.string().min(1, "Select the institution type."),
  departments: z.string().min(2, "List the departments you want to include."),
  yearBatch: z.string().min(1, "Select the year or batch."),
  contactPerson: z.string().min(2, "Enter a contact person."),
  designation: z.string().min(2, "Enter their designation."),
  email: z.string().email("Enter a valid email address."),
  phone: z
    .string()
    .min(8, "Enter a valid phone number.")
    .max(18, "Enter a valid phone number."),
  studentCount: z.string().min(1, "Select an approximate batch size."),
  interest: z.string().min(1, "Select the programme you are interested in."),
  message: z.string().max(600, "Keep the message under 600 characters.").optional(),
});

type FormValues = z.infer<typeof schema>;

const BATCH_SIZES = ["Under 50", "50–200", "200–500", "500+"];

/** Institutional outreach starts in the south, so these lead the list. */
const STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Maharashtra",
  "Delhi NCR",
  "Other",
];

const INSTITUTION_TYPES: { value: InstitutionType; label: string }[] = [
  { value: "engineering", label: "Engineering College" },
  { value: "degree", label: "Degree College" },
  { value: "university", label: "University" },
  { value: "training", label: "Training Institution" },
];

const YEAR_BATCHES = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "Final Year",
  "Mixed / Multiple batches",
];

export function CollegeEnquiryForm() {
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      collegeName: "",
      city: "",
      state: "",
      institutionType: "",
      departments: "",
      yearBatch: "",
      contactPerson: "",
      designation: "",
      email: "",
      phone: "",
      studentCount: "",
      interest: "",
      message: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: FormValues) {
    try {
      await createLead({
      collegeName: values.collegeName,
      city: values.city,
      state: values.state,
      institutionType: values.institutionType as InstitutionType,
      departments: values.departments,
      yearBatch: values.yearBatch,
      contactPerson: values.contactPerson,
      designation: values.designation,
      email: values.email,
      phone: values.phone,
      studentCount: values.studentCount,
      interest: values.interest,
      message: values.message ?? "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your enquiry could not be sent.");
      return;
    }
    setSubmitted(true);
    toast.success("Enquiry received", {
      description: "Our team will contact you.",
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/[0.06] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
          Thank you. Our team will contact you.
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your enquiry has been recorded. In this demo environment it appears in the
          admin College Leads view.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => {
            form.reset();
            setSubmitted(false);
          }}
        >
          Submit another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7"
    >
      <h3 className="font-display text-lg font-semibold text-foreground">
        Partner With Roystian
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tell us about your institution and we will follow up with a programme
        proposal.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="College Name" error={errors.collegeName?.message} htmlFor="collegeName">
          <Input
            id="collegeName"
            placeholder="Institute of Technology"
            aria-invalid={Boolean(errors.collegeName)}
            {...register("collegeName")}
          />
        </Field>

        <Field
          label="Institution Type"
          error={errors.institutionType?.message}
          htmlFor="institutionType"
        >
          <Select
            value={watch("institutionType")}
            onValueChange={(value) =>
              setValue("institutionType", value, { shouldValidate: true })
            }
          >
            <SelectTrigger
              id="institutionType"
              aria-invalid={Boolean(errors.institutionType)}
            >
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {INSTITUTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="City" error={errors.city?.message} htmlFor="city">
          <Input
            id="city"
            placeholder="Hyderabad"
            aria-invalid={Boolean(errors.city)}
            {...register("city")}
          />
        </Field>

        <Field label="State" error={errors.state?.message} htmlFor="state">
          <Select
            value={watch("state")}
            onValueChange={(value) => setValue("state", value, { shouldValidate: true })}
          >
            <SelectTrigger id="state" aria-invalid={Boolean(errors.state)}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Departments"
          error={errors.departments?.message}
          htmlFor="departments"
        >
          <Input
            id="departments"
            placeholder="CSE, ECE, Mechanical"
            aria-invalid={Boolean(errors.departments)}
            {...register("departments")}
          />
        </Field>

        <Field
          label="Year / Batch"
          error={errors.yearBatch?.message}
          htmlFor="yearBatch"
        >
          <Select
            value={watch("yearBatch")}
            onValueChange={(value) =>
              setValue("yearBatch", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="yearBatch" aria-invalid={Boolean(errors.yearBatch)}>
              <SelectValue placeholder="Select year or batch" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_BATCHES.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Contact Person"
          error={errors.contactPerson?.message}
          htmlFor="contactPerson"
        >
          <Input
            id="contactPerson"
            placeholder="Dr. A. Sharma"
            aria-invalid={Boolean(errors.contactPerson)}
            {...register("contactPerson")}
          />
        </Field>

        <Field
          label="Designation"
          error={errors.designation?.message}
          htmlFor="designation"
        >
          <Input
            id="designation"
            placeholder="Training & Placement Officer"
            aria-invalid={Boolean(errors.designation)}
            {...register("designation")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} htmlFor="collegeEmail">
          <Input
            id="collegeEmail"
            type="email"
            placeholder="tpo@college.edu"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message} htmlFor="collegePhone">
          <Input
            id="collegePhone"
            type="tel"
            placeholder="+91 90000 00000"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </Field>

        <Field
          label="Number of Students"
          error={errors.studentCount?.message}
          htmlFor="studentCount"
        >
          <Select
            value={watch("studentCount")}
            onValueChange={(value) =>
              setValue("studentCount", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="studentCount" aria-invalid={Boolean(errors.studentCount)}>
              <SelectValue placeholder="Select batch size" />
            </SelectTrigger>
            <SelectContent>
              {BATCH_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} students
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Interested Program"
          error={errors.interest?.message}
          htmlFor="interest"
        >
          <Select
            value={watch("interest")}
            onValueChange={(value) => setValue("interest", value, { shouldValidate: true })}
          >
            <SelectTrigger id="interest" aria-invalid={Boolean(errors.interest)}>
              <SelectValue placeholder="Select a programme" />
            </SelectTrigger>
            <SelectContent>
              {COLLEGE_OFFERINGS.map((offering) => (
                <SelectItem key={offering.id} value={offering.title}>
                  {offering.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Message" error={errors.message?.message} htmlFor="message" optional>
            <Textarea
              id="message"
              rows={4}
              placeholder="Tell us about your batch, timelines and what you would like to run."
              aria-invalid={Boolean(errors.message)}
              {...register("message")}
            />
          </Field>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send /> Submit enquiry
          </>
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-2 flex items-center gap-1.5">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
