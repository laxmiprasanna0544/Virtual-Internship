import type { Metadata } from "next";
import { StartShell } from "@/components/start/start-shell";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your internship registration and complete the simulated payment to activate your dashboard.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <StartShell
      step={5}
      title="Registration & Payment"
      description="Check your details, choose a payment method and start your internship. This is a demo environment — no real payment is processed."
      backHref="/start/program"
      backLabel="Back to programme"
    >
      <CheckoutView />
    </StartShell>
  );
}
