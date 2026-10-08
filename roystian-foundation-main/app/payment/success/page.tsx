import type { Metadata } from "next";
import { Suspense } from "react";
import { StartShell } from "@/components/start/start-shell";
import { PaymentSuccessView } from "@/components/checkout/payment-success";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your Roystian Foundation virtual internship registration is confirmed.",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <StartShell
      step={6}
      title="Payment Successful"
      description="Your registration is confirmed and your dashboard has been activated."
    >
      <Suspense fallback={<LoadingState rows={3} />}>
        <PaymentSuccessView />
      </Suspense>
    </StartShell>
  );
}
