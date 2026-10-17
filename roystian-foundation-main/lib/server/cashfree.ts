import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cashfree Payment Gateway (PG API version 2023-08-01).
 *
 *   CASHFREE_ENV        "production" | "sandbox" | "mock"
 *   CASHFREE_APP_ID     x-client-id
 *   CASHFREE_SECRET_KEY x-client-secret; also signs webhooks
 *   CASHFREE_API_BASE   only for "mock": a local stand-in (scripts/mock-cashfree.mjs)
 */

export type CashfreeEnvironment = "production" | "sandbox" | "mock";

const API_VERSION = "2023-08-01";
const BASES: Record<Exclude<CashfreeEnvironment, "mock">, string> = {
  production: "https://api.cashfree.com/pg",
  sandbox: "https://sandbox.cashfree.com/pg",
};
// A mock gateway can confirm payments, so it may only ever be reached locally.
const MOCK_HOSTS = new Set(["localhost", "127.0.0.1", "host.docker.internal", "cashfree"]);

export class CashfreeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

export interface CashfreeConfig {
  environment: CashfreeEnvironment;
  appId: string;
  secretKey: string;
  /** API base, e.g. https://api.cashfree.com/pg */
  base: string;
  /** Origin of the mock (hosted checkout lives at <origin>/checkout/<session>). */
  mockOrigin: string | null;
}

export function cashfreeConfig(): CashfreeConfig {
  const environment = process.env.CASHFREE_ENV as CashfreeEnvironment | undefined;
  const appId = process.env.CASHFREE_APP_ID ?? "";
  const secretKey = process.env.CASHFREE_SECRET_KEY ?? "";
  if (!environment || !["production", "sandbox", "mock"].includes(environment)) {
    throw new Error('CASHFREE_ENV must be "production", "sandbox" or "mock"');
  }
  if (!appId || !secretKey) throw new Error("CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set");

  if (environment === "mock") {
    const raw = process.env.CASHFREE_API_BASE ?? "";
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error("CASHFREE_API_BASE must be set for the mock gateway");
    }
    if (!MOCK_HOSTS.has(url.hostname)) {
      throw new Error("The mock gateway is only allowed on a local host");
    }
    const origin = url.origin;
    // Where the browser reaches the mock's checkout page, if not the same
    // address the server uses (e.g. a public tunnel to a local mock).
    const publicOrigin = process.env.CASHFREE_MOCK_PUBLIC_URL ? new URL(process.env.CASHFREE_MOCK_PUBLIC_URL).origin : origin;
    return { environment, appId, secretKey, base: `${origin}/pg`, mockOrigin: publicOrigin };
  }
  return { environment, appId, secretKey, base: BASES[environment], mockOrigin: null };
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const config = cashfreeConfig();
  const res = await fetch(`${config.base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; code?: string };
  if (!res.ok) {
    throw new CashfreeError(data.message ?? `Cashfree ${method} ${path} failed`, res.status, data.code);
  }
  return data;
}

export interface CashfreeOrder {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id: string;
}

export interface CashfreePayment {
  cf_payment_id: string | number;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "NOT_ATTEMPTED" | "USER_DROPPED" | "VOID" | "CANCELLED";
  payment_amount: number;
  payment_group?: string;
  payment_message?: string;
}

export interface CashfreeRefund {
  cf_refund_id?: string | number;
  refund_id: string;
  refund_status?: string;
  refund_amount?: number;
}

export function createOrder(input: {
  orderId: string;
  amountRupees: number;
  customer: { id: string; name: string; email: string; phone: string };
  returnUrl: string;
  notifyUrl: string;
}): Promise<CashfreeOrder> {
  return call<CashfreeOrder>(
    "POST",
    "/orders",
    {
      order_id: input.orderId,
      order_amount: input.amountRupees,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
      },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
    },
    input.orderId,
  );
}

export function getOrder(orderId: string): Promise<CashfreeOrder> {
  return call<CashfreeOrder>("GET", `/orders/${encodeURIComponent(orderId)}`);
}

export function getOrderPayments(orderId: string): Promise<CashfreePayment[]> {
  return call<CashfreePayment[]>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);
}

export function createRefund(input: {
  orderId: string;
  refundId: string;
  amountRupees: number;
  note: string;
}): Promise<CashfreeRefund> {
  return call<CashfreeRefund>(
    "POST",
    `/orders/${encodeURIComponent(input.orderId)}/refunds`,
    { refund_amount: input.amountRupees, refund_id: input.refundId, refund_note: input.note.slice(0, 100) },
    input.refundId,
  );
}

/**
 * Webhook signature: Base64(HMAC-SHA256(timestamp + rawBody, secretKey)),
 * sent as x-webhook-signature with x-webhook-timestamp.
 */
export function verifyWebhookSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", cashfreeConfig().secretKey)
    .update(timestamp + rawBody)
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Cashfree's payment_group → our payment_method enum. */
export function paymentMethodFromGroup(group: string | undefined | null): "upi" | "card" | "netbanking" {
  const value = (group ?? "").toLowerCase();
  if (value.includes("card")) return "card";
  if (value.includes("net_banking") || value.includes("netbanking")) return "netbanking";
  return "upi";
}
