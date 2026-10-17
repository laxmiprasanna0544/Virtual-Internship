import type { PaymentMethod, PaymentStatus } from "@/types";

/** Display labels for payments recorded from Cashfree. */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  successful: "Successful",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

/** Payment options offered on Cashfree's hosted checkout, for the order summary. */
export const ACCEPTED_PAYMENT_OPTIONS = ["UPI", "Debit and credit cards", "Net banking"] as const;
