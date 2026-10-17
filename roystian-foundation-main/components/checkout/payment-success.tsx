"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Copy,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { useStudentContext } from "@/lib/use-student";
import { formatDate, formatINR } from "@/lib/utils";

const AUTOMATED_STEPS = [
  { icon: CheckCircle2, label: "Payment confirmed by Cashfree" },
  { icon: Mail, label: "Confirmation email sent" },
  { icon: LayoutDashboard, label: "Dashboard activated" },
  { icon: Bell, label: "Programme team notified" },
];

/**
 * Shows the registration created when Cashfree confirmed the payment (see
 * /payment/status). Confirmation itself happens on the server; this page
 * only displays the result.
 */
export function PaymentSuccessView() {
  const searchParams = useSearchParams();
  const ctx = useStudentContext();
  const [visibleSteps, setVisibleSteps] = React.useState(0);
  const registrationId = searchParams.get("registrationId") || searchParams.get("id");

  React.useEffect(() => {
    if (!ctx.ready) return;
    const timers = AUTOMATED_STEPS.map((_, index) =>
      window.setTimeout(() => setVisibleSteps(index + 1), 350 * (index + 1)),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [ctx.ready]);

  if (!ctx.ready) {
    return <div className="skeleton h-72 rounded-2xl" />;
  }

  const registration = registrationId
    ? ctx.registrations.find((r) => r.id === registrationId)
    : ctx.registration;

  if (!registration || registration.paymentStatus !== "successful") {
    return (
      <EmptyState
        title="No registration found"
        description="We could not find a confirmed registration on your account. Start the onboarding flow to create one."
        actionLabel="Start my internship"
        actionHref="/start"
      />
    );
  }

  const domain = getDomain(registration.domainId);
  const program = getProgram(registration.programId);

  const confirmedId = registration.id;

  function copyId() {
    navigator.clipboard
      ?.writeText(confirmedId)
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
          These happen automatically once the payment is confirmed.
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
