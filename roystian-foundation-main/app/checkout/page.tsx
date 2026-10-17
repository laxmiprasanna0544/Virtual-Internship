import type { Metadata } from "next";
import { StartShell } from "@/components/start/start-shell";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your internship registration and pay securely through Cashfree to activate your dashboard.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <StartShell
      step={5}
      title="Registration & Payment"
      description="Check your details, then pay securely through Cashfree to start your internship."
      backHref="/start/program"
      backLabel="Back to programme"
    >
      <CheckoutView />
    </StartShell>
  );
}
