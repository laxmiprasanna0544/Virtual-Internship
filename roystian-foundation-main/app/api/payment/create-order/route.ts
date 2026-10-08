import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://sandbox.cashfree.com/pg";

export async function POST(req: NextRequest) {
  const { orderId, amount, customerName, customerEmail, customerPhone } =
    await req.json();

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 },
    );
  }

  const customerId = customerEmail
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 50);

  const origin = req.nextUrl.origin;
  const returnUrl = `${origin}/payment/success?order_id={order_id}`;

  const res = await fetch(`${CF_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone.replace(/\D/g, "").slice(-10),
      },
      order_meta: {
        return_url: returnUrl,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("Cashfree create order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json({
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
  });
}
