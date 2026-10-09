"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/states";
import { PaymentProcessingDialog } from "@/components/checkout/payment-processing";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { EXPERIENCE_LEVELS } from "@/data/content";
import { getDraft, saveDraft, clearDraft } from "@/lib/onboarding";
import { PAYMENT_METHODS } from "@/lib/payments";
import { updateOwnProfile } from "@/lib/auth";
import { enrol } from "@/lib/student-data";
import { formatINR, cn } from "@/lib/utils";
import type { OnboardingDraft, PaymentMethod } from "@/types";

const METHOD_ICON: Record<PaymentMethod, typeof CreditCard> = {
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
};

type Phase = "idle" | "loading" | "failed";

export function CheckoutView() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<OnboardingDraft | null>(null);
  const [method, setMethod] = React.useState<PaymentMethod>("upi");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [processingOpen, setProcessingOpen] = React.useState(false);
  const [simulateFailure, setSimulateFailure] = React.useState(false);
  const [failureError, setFailureError] = React.useState<string | null>(null);

  // Method specific demo fields
  const [upiId, setUpiId] = React.useState("rahul.sharma@okhdfcbank");
  const [cardNumber, setCardNumber] = React.useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = React.useState("12/28");
  const [cardCvv, setCardCvv] = React.useState("888");
  const [bank, setBank] = React.useState("hdfc");

  React.useEffect(() => {
    setDraft(getDraft());
  }, []);

  if (!draft) {
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

  const detailsComplete = Boolean(
    draft.fullName && draft.email && draft.mobile && draft.college && draft.course,
  );

  function handleDetailChange(field: keyof OnboardingDraft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function persistDetails() {
    if (!draft) return;
    saveDraft({
      fullName: draft.fullName,
      email: draft.email,
      mobile: draft.mobile,
      college: draft.college,
      course: draft.course,
    });
  }

  function handlePay() {
    if (!draft || !domain || !program || !draft.experience) return;
    if (!detailsComplete) {
      toast.error("Complete your student details first.");
      return;
    }
    persistDetails();
    setFailureError(null);
    setPhase("loading");
    setProcessingOpen(true);
  }

  async function handleSimulationComplete() {
    setProcessingOpen(false);
    if (!draft || !domain || !program || !draft.experience) return;

    if (simulateFailure) {
      setPhase("failed");
      setFailureError(
        "Simulated payment declined. No amount has been charged. You can retry with another method or untick the failure box.",
      );
      toast.error("Payment failed: simulated failure");
      return;
    }

    try {
      // Checkout requires sign-in (middleware.ts), so the onboarding details
      // are saved onto the signed-in student's own profile first.
      const saved = await updateOwnProfile({
        name: draft.fullName,
        email: draft.email,
        mobile: draft.mobile,
        college: draft.college,
        course: draft.course,
        city: draft.city,
        educationLevel: draft.educationLevel || "undergraduate",
      });
      if (!saved.ok) throw new Error(saved.error);

      const registration = await enrol({
        domainId: domain.id,
        programId: program.id,
        experience: draft.experience,
        method,
      });

      setPhase("idle");
      clearDraft();
      router.push(`/payment/success?registrationId=${encodeURIComponent(registration.id)}`);
    } catch (err) {
      console.error("Registration creation failed:", err);
      setPhase("failed");
      setFailureError(
        err instanceof Error && err.message ? err.message : "Registration creation failed. Please try again.",
      );
      toast.error("Registration failed");
    }
  }

  const isLoading = phase === "loading" || processingOpen;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      {/* Left: details + payment */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Student Details
            </h2>
            <Link
              href="/start"
              className="text-xs font-medium text-primary hover:underline"
            >
              Edit in onboarding
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { id: "fullName", label: "Name", type: "text" },
              { id: "email", label: "Email", type: "email" },
              { id: "mobile", label: "Mobile", type: "tel" },
              { id: "college", label: "College", type: "text" },
            ].map((field) => (
              <div key={field.id}>
                <Label htmlFor={`checkout-${field.id}`} className="mb-2 block">
                  {field.label}
                </Label>
                <Input
                  id={`checkout-${field.id}`}
                  type={field.type}
                  value={(draft[field.id as keyof OnboardingDraft] as string) ?? ""}
                  onChange={(event) =>
                    handleDetailChange(
                      field.id as keyof OnboardingDraft,
                      event.target.value,
                    )
                  }
                  onBlur={persistDetails}
                  disabled={isLoading}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="checkout-course" className="mb-2 block">
                Course
              </Label>
              <Input
                id="checkout-course"
                value={draft.course}
                onChange={(event) => handleDetailChange("course", event.target.value)}
                onBlur={persistDetails}
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Payment Method
          </h2>

          <ul
            className="mt-5 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Payment method"
          >
            {PAYMENT_METHODS.map((option) => {
              const Icon = METHOD_ICON[option.value];
              const active = method === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setMethod(option.value);
                      setFailureError(null);
                    }}
                    disabled={isLoading}
                    className={cn(
                      "flex h-full w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
                      active
                        ? "border-primary bg-primary/[0.05]"
                        : "border-border bg-background hover:border-primary/35",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[1.1rem] w-[1.1rem]",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Dynamic method fields */}
          <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
            {method === "upi" && (
              <div>
                <Label htmlFor="checkout-upi" className="mb-2 block">
                  UPI ID / VPA
                </Label>
                <Input
                  id="checkout-upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Simulated UPI handle. Any test ID is accepted.
                </p>
              </div>
            )}

            {method === "card" && (
              <div className="space-y-3.5">
                <div>
                  <Label htmlFor="checkout-card" className="mb-2 block">
                    Card Number
                  </Label>
                  <Input
                    id="checkout-card"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="checkout-expiry" className="mb-2 block">
                      Expiry
                    </Label>
                    <Input
                      id="checkout-expiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout-cvv" className="mb-2 block">
                      CVV
                    </Label>
                    <Input
                      id="checkout-cvv"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      type="password"
                      maxLength={4}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pre-filled test credentials. No card data is stored or transmitted.
                </p>
              </div>
            )}

            {method === "netbanking" && (
              <div>
                <Label htmlFor="checkout-bank" className="mb-2 block">
                  Select Bank
                </Label>
                <Select value={bank} onValueChange={setBank} disabled={isLoading}>
                  <SelectTrigger id="checkout-bank">
                    <SelectValue placeholder="Choose bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="sbi">State Bank of India</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="axis">Axis Bank</SelectItem>
                    <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Simulated net banking institution for demo testing.
                </p>
              </div>
            )}
          </div>

          {/* Simulate failure option */}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <Checkbox
              id="simulate-failure"
              checked={simulateFailure}
              onCheckedChange={(checked) => {
                setSimulateFailure(Boolean(checked));
                setFailureError(null);
              }}
              disabled={isLoading}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="simulate-failure" className="text-sm font-medium cursor-pointer">
                Simulate a failed payment
              </Label>
              <p className="text-xs text-muted-foreground">
                Tests the error handling and retry flow without completing registration.
              </p>
            </div>
          </div>

          {failureError && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Payment not completed</p>
                <p className="mt-1 text-xs">{failureError}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Right: order summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Order Summary
          </h2>

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
            <span className="font-display text-2xl font-semibold text-foreground">
              {formatINR(program.price)}
            </span>
          </div>

          <Button
            size="xl"
            className="mt-6 w-full"
            onClick={handlePay}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Processing payment…
              </>
            ) : (
              <>
                <Lock /> PAY {formatINR(program.price)} &amp; START MY INTERNSHIP
              </>
            )}
          </Button>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            {[
              "Dashboard activates immediately after payment",
              "Certificate unlocks only after completion requirements",
              "Simulated test gateway — zero risk demo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>

          <Badge variant="secondary" className="mt-5">
            Refunds follow the published refund policy
          </Badge>
        </div>
      </aside>

      {/* Payment Processing Simulation Dialog */}
      <PaymentProcessingDialog
        open={processingOpen}
        amount={program.price}
        method={method}
        onComplete={handleSimulationComplete}
      />
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
