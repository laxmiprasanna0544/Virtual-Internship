import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://sandbox.cashfree.com/pg";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(
    `${CF_BASE}/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json({
    status: data.order_status as string,
    amount: data.order_amount as number,
    currency: data.order_currency as string,
  });
}
