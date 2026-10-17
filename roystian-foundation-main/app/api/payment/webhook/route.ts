import { NextRequest, NextResponse } from "next/server";
import { paymentMethodFromGroup, verifyWebhookSignature } from "@/lib/server/cashfree";
import { completePaidOrder, failOrder } from "@/lib/server/payments";
import type { Json } from "@/types/db";

interface WebhookBody {
  type?: string;
  data?: {
    order?: { order_id?: string; order_amount?: number | string };
    payment?: {
      cf_payment_id?: string | number;
      payment_status?: string;
      payment_amount?: number | string;
      payment_group?: string;
      payment_message?: string;
    };
  };
}

/**
 * Cashfree payment webhook. Authenticated by its HMAC signature (not by
 * cookies or origin). Retries are safe: completion is idempotent on the order.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let valid = false;
  try {
    valid = verifyWebhookSignature(
      raw,
      req.headers.get("x-webhook-timestamp"),
      req.headers.get("x-webhook-signature"),
    );
  } catch (error) {
    console.error("webhook verification unavailable:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  const orderId = body.data?.order?.order_id;
  if (!orderId) return NextResponse.json({ ok: true });
  const payload = body as unknown as Json;

  switch (body.type) {
    case "PAYMENT_SUCCESS_WEBHOOK": {
      const payment = body.data?.payment;
      const amount = Number(payment?.payment_amount ?? body.data?.order?.order_amount);
      if (!Number.isFinite(amount)) return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
      const result = await completePaidOrder({
        orderId,
        amountPaise: Math.round(amount * 100),
        method: paymentMethodFromGroup(payment?.payment_group),
        providerPaymentId: payment?.cf_payment_id != null ? String(payment.cf_payment_id) : null,
        payload,
      });
      // An order we never created is acknowledged (so Cashfree stops retrying)
      // but changes nothing. A rejected one (amount mismatch) is logged above.
      return NextResponse.json({ ok: result.ok });
    }
    case "PAYMENT_FAILED_WEBHOOK":
    case "PAYMENT_USER_DROPPED_WEBHOOK":
      await failOrder(
        orderId,
        body.data?.payment?.payment_message ?? body.type.toLowerCase(),
        payload,
      ).catch((error) => console.error("fail_payment failed:", error instanceof Error ? error.message : error));
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: true });
  }
}
