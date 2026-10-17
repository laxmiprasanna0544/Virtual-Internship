"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { EXPERIENCE_LEVELS } from "@/data/content";
import { getDraft, saveDraft } from "@/lib/onboarding";
import { ACCEPTED_PAYMENT_OPTIONS } from "@/lib/payments";
import { updateOwnProfile, useSession } from "@/lib/auth";
import { startCheckout } from "@/lib/checkout";
import { formatINR } from "@/lib/utils";
import type { OnboardingDraft } from "@/types";

const MOBILE_PATTERN = /^\+?[\d\s-]{10,16}$/;

export function CheckoutView() {
  const session = useSession();
  const [draft, setDraft] = React.useState<OnboardingDraft | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(getDraft());
  }, []);

  if (!draft || !session.ready) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const domain = getDomain(draft.domainId);
  const program = getProgram(draft.programId);
  const level = EXPERIENCE_LEVELS.find((e) => e.value === draft.experience);
  // Checkout requires sign-in; the account's email is the one Cashfree receipts go to.
  const accountEmail = session.user?.email ?? draft.email;

  if (!domain || !program || !draft.experience) {
    return (
      <EmptyState
        title="Your registration is incomplete"
        description="Choose a domain, an experience level and a programme before checking out."
        actionLabel="Continue onboarding"
        actionHref="/start"
      />
    );
  }

  const mobileValid = MOBILE_PATTERN.test(draft.mobile.trim());
  const detailsComplete = Boolean(draft.fullName.trim() && mobileValid && draft.college.trim() && draft.course.trim());

  function handleDetailChange(field: keyof OnboardingDraft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function persistDetails() {
    if (!draft) return;
    saveDraft({
      fullName: draft.fullName,
      mobile: draft.mobile,
      college: draft.college,
      course: draft.course,
    });
  }

  async function handlePay() {
    if (!draft || !domain || !program || !draft.experience) return;
    if (!detailsComplete) {
      setError(
        mobileValid
          ? "Complete your student details first."
          : "Enter a valid 10-digit mobile number — Cashfree requires one for payment.",
      );
      return;
    }
    persistDetails();
    setError(null);
    setPaying(true);
    try {
      // Saved onto the signed-in student's profile; Cashfree uses the name and mobile.
      const saved = await updateOwnProfile({
        name: draft.fullName,
        email: accountEmail,
        mobile: draft.mobile,
        college: draft.college,
        course: draft.course,
        city: draft.city,
        educationLevel: draft.educationLevel || "undergraduate",
      });
      if (!saved.ok) throw new Error(saved.error);

      // Leaves the page for Cashfree's hosted checkout, which returns to /payment/status.
      await startCheckout({ domainId: domain.id, programId: program.id, experience: draft.experience });
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Could not start the payment. Please try again.";
      setError(message);
      toast.error(message);
      setPaying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Student Details</h2>
            <Link href="/start" className="text-xs font-medium text-primary hover:underline">
              Edit in onboarding
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { id: "fullName", label: "Name", type: "text", autoComplete: "name" },
              { id: "mobile", label: "Mobile", type: "tel", autoComplete: "tel" },
              { id: "college", label: "College", type: "text", autoComplete: "organization" },
              { id: "course", label: "Course", type: "text", autoComplete: "off" },
            ].map((field) => (
              <div key={field.id}>
                <Label htmlFor={`checkout-${field.id}`} className="mb-2 block">
                  {field.label}
                </Label>
                <Input
                  id={`checkout-${field.id}`}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={(draft[field.id as keyof OnboardingDraft] as string) ?? ""}
                  onChange={(event) => handleDetailChange(field.id as keyof OnboardingDraft, event.target.value)}
                  onBlur={persistDetails}
                  disabled={paying}
                  aria-invalid={field.id === "mobile" && draft.mobile !== "" && !mobileValid}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="checkout-email" className="mb-2 block">
                Email
              </Label>
              <Input id="checkout-email" type="email" value={accountEmail} readOnly disabled />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Your receipt and confirmation go to your account email. Change it from your profile.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Secure payment
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You will complete the payment on Cashfree&apos;s secure checkout and return here automatically. We never
            see or store your card or bank details.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ACCEPTED_PAYMENT_OPTIONS.map((option) => (
              <li key={option}>
                <Badge variant="secondary">{option}</Badge>
              </li>
            ))}
          </ul>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Payment not started</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground">Order Summary</h2>

          <dl className="mt-5 space-y-3.5 text-sm">
            <Row label="Domain" value={domain.name} />
            <Row label="Program" value={program.name} />
            <Row label="Experience" value={level?.label ?? "—"} />
            <Row label="Duration" value={program.durationLabel} />
            <Row label="Program Fee" value={formatINR(program.price)} />
            {program.pehlaChanceIncluded && (
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  PehlaChance (1 month)
                </dt>
                <dd className="font-semibold text-success">FREE</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="font-display text-2xl font-semibold text-foreground">{formatINR(program.price)}</span>
          </div>

          <Button size="xl" className="mt-6 w-full" onClick={handlePay} disabled={paying}>
            {paying ? (
              <>
                <Loader2 className="animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              <>
                <Lock /> PAY {formatINR(program.price)} &amp; START MY INTERNSHIP
              </>
            )}
          </Button>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            {[
              "Dashboard activates as soon as the payment is confirmed",
              "Certificate unlocks only after completion requirements",
              "Payments processed by Cashfree Payments",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <Badge variant="secondary" className="mt-5">
            Refunds follow the published refund policy
          </Badge>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
