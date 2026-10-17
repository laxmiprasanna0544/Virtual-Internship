"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { fetchOrderStatus, type OrderStatus } from "@/lib/checkout";
import { refreshStudentData } from "@/lib/student-data";

const POLL_MS = 2000;
const MAX_WAIT_MS = 60_000;

/**
 * Where Cashfree returns the student after checkout. The enrolment is made by
 * the server when the payment is confirmed (signed webhook or an order status
 * check); this page only waits for that and then moves on.
 */
export function PaymentStatusView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") ?? searchParams.get("orderId");
  const [status, setStatus] = React.useState<OrderStatus | "checking" | "error">("checking");
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: number | undefined;
    const started = Date.now();

    const poll = async () => {
      try {
        const result = await fetchOrderStatus(orderId);
        if (cancelled) return;
        setStatus(result.status);
        if (result.status === "successful" && result.registrationId) {
          await refreshStudentData();
          router.replace(`/payment/success?registrationId=${encodeURIComponent(result.registrationId)}`);
          return;
        }
        if (result.status === "failed") return;
      } catch {
        if (cancelled) return;
        setStatus((current) => (current === "checking" ? "error" : current));
      }
      if (Date.now() - started >= MAX_WAIT_MS) {
        setTimedOut(true);
        return;
      }
      timer = window.setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderId, router]);

  if (!orderId) {
    return (
      <EmptyState
        title="No payment to check"
        description="Start from the programme you want to join."
        actionLabel="Start my internship"
        actionHref="/start"
      />
    );
  }

  if (status === "failed") {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-card sm:p-8">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Payment not completed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The payment did not go through and you have not been charged. If money was debited, it is returned
          automatically by your bank.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/checkout">Try again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (timedOut || status === "error") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">We&apos;re still confirming your payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This can take a few minutes. Your dashboard activates as soon as Cashfree confirms the payment, and we
          email you when it does. Order reference: <span className="font-mono">{orderId}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Check again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Confirming your payment…</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Please keep this page open. Order reference: <span className="font-mono">{orderId}</span>
      </p>
    </div>
  );
}
