import type { Metadata } from "next";
import { Suspense } from "react";
import { StartShell } from "@/components/start/start-shell";
import { PaymentStatusView } from "@/components/checkout/payment-status";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Payment Status",
  description: "Confirming your Roystian Foundation virtual internship payment.",
  robots: { index: false, follow: false },
};

export default function PaymentStatusPage() {
  return (
    <StartShell
      step={6}
      title="Payment"
      description="We confirm every payment with Cashfree before activating your dashboard."
    >
      <Suspense fallback={<LoadingState rows={3} />}>
        <PaymentStatusView />
      </Suspense>
    </StartShell>
  );
}
