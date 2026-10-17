"use client";

import type { ExperienceLevel, ProgramId } from "@/types";

/**
 * Browser side of Cashfree checkout. The server creates the order (amount
 * from the catalogue); the browser only hands the payment session to
 * Cashfree's hosted checkout, which returns to /payment/status.
 */

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

interface CreateOrderResponse {
  orderId: string;
  paymentSessionId: string;
  environment: "production" | "sandbox" | "mock";
  /** Local mock gateway only. */
  checkoutUrl?: string;
  error?: string;
  code?: string;
}

type CashfreeFactory = (options: { mode: "production" | "sandbox" }) => {
  checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }) => Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";
let sdkPromise: Promise<CashfreeFactory> | null = null;

function loadSdk(): Promise<CashfreeFactory> {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  sdkPromise ??= new Promise<CashfreeFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () =>
      window.Cashfree ? resolve(window.Cashfree) : reject(new CheckoutError("The payment page could not be loaded."));
    script.onerror = () => {
      sdkPromise = null;
      reject(new CheckoutError("The payment page could not be loaded. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

/** Creates the order on the server and sends the browser to Cashfree. */
export async function startCheckout(input: {
  domainId: string;
  programId: ProgramId;
  experience: ExperienceLevel;
}): Promise<void> {
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as CreateOrderResponse;
  if (!res.ok || !data.paymentSessionId) {
    throw new CheckoutError(data.error ?? "Could not start the payment. Please try again.", data.code);
  }

  if (data.checkoutUrl) {
    window.location.assign(data.checkoutUrl);
    return;
  }
  const Cashfree = await loadSdk();
  await Cashfree({ mode: data.environment === "production" ? "production" : "sandbox" }).checkout({
    paymentSessionId: data.paymentSessionId,
    redirectTarget: "_self",
  });
}

export type OrderStatus = "successful" | "pending" | "failed";

export async function fetchOrderStatus(orderId: string): Promise<{ status: OrderStatus; registrationId?: string }> {
  const res = await fetch(`/api/payment/verify?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { status?: OrderStatus; registrationId?: string; error?: string };
  if (!res.ok || !data.status) throw new CheckoutError(data.error ?? "Could not check the payment.");
  return { status: data.status, registrationId: data.registrationId };
}
