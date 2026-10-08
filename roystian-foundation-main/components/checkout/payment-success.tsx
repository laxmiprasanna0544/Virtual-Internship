"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Copy,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { useDatabase } from "@/lib/db";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getDraft, clearDraft } from "@/lib/onboarding";
import { createRegistration } from "@/lib/payments";
import { getCurrentStudent, loginAs } from "@/lib/auth";
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from "@/lib/storage";
import { formatDate, formatINR } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const AUTOMATED_STEPS = [
  { icon: Mail, label: "Confirmation email sent" },
  { icon: MessageCircle, label: "WhatsApp confirmation sent" },
  { icon: LayoutDashboard, label: "Dashboard activated" },
  { icon: Bell, label: "Programme team notified" },
];

type Status = "verifying" | "creating" | "ready" | "failed";

interface PendingPayment {
  cfOrderId: string;
  method: PaymentMethod;
}

interface CompletedPayment {
  cfOrderId: string;
  registrationId: string;
}

export function PaymentSuccessView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useDatabase();
  const [status, setStatus] = React.useState<Status>("verifying");
  const [registrationId, setRegistrationId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [visibleSteps, setVisibleSteps] = React.useState(0);

  const cfOrderId = searchParams.get("order_id");
  const regIdParam = searchParams.get("registrationId") || searchParams.get("id");

  React.useEffect(() => {
    if (regIdParam) {
      setRegistrationId(regIdParam);
      setStatus("ready");
      return;
    }

    if (!cfOrderId) {
      const current = getCurrentStudent();
      if (current?.registrationId) {
        setRegistrationId(current.registrationId);
        setStatus("ready");
        return;
      }
      setStatus("failed");
      setErrorMessage("No payment order found. Please try again.");
      return;
    }

    const completed = readStorage<CompletedPayment | null>(
      STORAGE_KEYS.completedPayment,
      null,
    );
    if (completed && completed.cfOrderId === cfOrderId) {
      setRegistrationId(completed.registrationId);
      setStatus("ready");
      return;
    }

    async function verifyAndRegister() {
      try {
        const res = await fetch(
          `/api/payment/verify?orderId=${encodeURIComponent(cfOrderId!)}`,
        );
        if (!res.ok) throw new Error("Verification request failed");

        const { status: paymentStatus } = await res.json();

        if (paymentStatus !== "PAID") {
          setStatus("failed");
          setErrorMessage(
            paymentStatus === "ACTIVE"
              ? "Payment was not completed. Please try again."
              : `Payment ${paymentStatus?.toLowerCase() ?? "failed"}. No amount has been charged.`,
          );
          return;
        }

        setStatus("creating");

        const pending = readStorage<PendingPayment | null>(
          STORAGE_KEYS.pendingPayment,
          null,
        );
        const draft = getDraft();

        if (
          !draft.fullName ||
          !draft.email ||
          !draft.mobile ||
          !draft.college ||
          !draft.course ||
          !draft.domainId ||
          !draft.programId ||
          !draft.experience
        ) {
          setStatus("failed");
          setErrorMessage(
            "Registration data not found. Please contact support with your payment reference.",
          );
          return;
        }

        const existing = getCurrentStudent();
        const result = createRegistration({
          name: draft.fullName,
          email: draft.email,
          mobile: draft.mobile,
          college: draft.college,
          course: draft.course,
          city: draft.city,
          educationLevel: draft.educationLevel || undefined,
          domainId: draft.domainId,
          experience: draft.experience,
          programId: draft.programId,
          method: pending?.method ?? "upi",
          existingStudentId: existing?.id ?? null,
        });

        loginAs(result.student.id, "student");
        clearDraft();
        removeStorage(STORAGE_KEYS.pendingPayment);

        writeStorage<CompletedPayment>(STORAGE_KEYS.completedPayment, {
          cfOrderId: cfOrderId!,
          registrationId: result.registration.id,
        });

        setRegistrationId(result.registration.id);
        setStatus("ready");
      } catch (err) {
        console.error("Payment verification error:", err);
        setStatus("failed");
        setErrorMessage("Could not verify your payment. Please contact support.");
      }
    }

    verifyAndRegister();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfOrderId]);

  React.useEffect(() => {
    if (status !== "ready") return;
    const timers = AUTOMATED_STEPS.map((_, index) =>
      window.setTimeout(() => setVisibleSteps(index + 1), 350 * (index + 1)),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [status]);

  if (status === "verifying" || status === "creating") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">
          {status === "verifying" ? "Verifying your payment…" : "Activating your dashboard…"}
        </p>
        <p className="text-xs text-muted-foreground">This will only take a moment.</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Payment not confirmed
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/checkout")}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/start">Back to onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!db) {
    return <div className="skeleton h-72 rounded-2xl" />;
  }

  const registration =
    db.registrations.find((r) => r.id === registrationId) ?? db.registrations[0];

  if (!registration) {
    return (
      <EmptyState
        title="No registration found"
        description="We could not find a registration to show. Start the onboarding flow to create one."
        actionLabel="Start my internship"
        actionHref="/start"
      />
    );
  }

  const domain = getDomain(registration.domainId);
  const program = getProgram(registration.programId);

  function copyId() {
    navigator.clipboard
      ?.writeText(registration.id)
      .then(() => toast.success("Registration ID copied"))
      .catch(() => toast.error("Could not copy the ID"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      <div className="min-w-0 rounded-2xl border border-success/30 bg-card p-6 shadow-card sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
          ✓ Payment Successful
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to Roystian Foundation.
        </p>

        <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Registration ID
            </dt>
            <dd className="mt-1.5 flex items-center gap-2">
              <span className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 font-mono text-sm font-semibold text-foreground">
                {registration.id}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyId}
                aria-label="Copy registration ID"
              >
                <Copy />
              </Button>
            </dd>
          </div>
          {[
            { label: "Domain", value: domain?.name ?? "—" },
            { label: "Program", value: program?.name ?? "—" },
            { label: "Start Date", value: formatDate(registration.startDate) },
            { label: "Amount Paid", value: formatINR(registration.amount) },
          ].map((row) => (
            <div key={row.label} className="border-b border-border pb-3.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link href="/dashboard">
              GO TO MY DASHBOARD <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/profile">View Registration</Link>
          </Button>
        </div>
      </div>

      <aside className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Automated communications
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          These run automatically when a payment succeeds.
        </p>
        <ul className="mt-5 space-y-3" aria-live="polite">
          {AUTOMATED_STEPS.map((step, index) => {
            const done = index < visibleSteps;
            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                  done
                    ? "border-success/30 bg-success/[0.05]"
                    : "border-border bg-muted/30 opacity-60"
                }`}
              >
                {done ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <step.icon
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm text-foreground">{step.label}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
          Your certificate is not issued yet. It unlocks after you complete the modules,
          assessments, practical task and final assessment — and, for the Industry-Led
          programme, after the 15-day programme duration has elapsed.
        </p>
      </aside>
    </div>
  );
}
