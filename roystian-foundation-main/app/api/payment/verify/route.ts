import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { reconcileOrder } from "@/lib/server/payments";
import { rateLimit } from "@/lib/server/rate-limit";

/**
 * Status of one of the signed-in student's orders. If the webhook has not
 * arrived yet, asks Cashfree directly and completes a paid order.
 */
export async function GET(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const orderId = req.nextUrl.searchParams.get("orderId") ?? "";
  if (!/^[A-Za-z0-9_-]{1,45}$/.test(orderId)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const limited = rateLimit(`verify:${auth.user.id}`, 60, 60);
  if (limited) return limited;

  const sql = getSql();
  const load = async () => {
    const [row] = await sql<{ status: string; registration_id: string | null }[]>`
      select status, registration_id from public.payments
      where provider_order_id = ${orderId} and student_id = ${auth.user.id}`;
    return row;
  };

  let payment = await load();
  if (!payment) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (payment.status === "pending") {
    try {
      const status = await reconcileOrder(orderId);
      if (status !== "pending") payment = (await load()) ?? payment;
      if (status === "failed" && payment.status === "pending") {
        return NextResponse.json({ status: "failed" }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch (error) {
      console.error("order status check failed:", error instanceof Error ? error.message : error);
    }
  }

  const status =
    payment.status === "successful" || payment.status === "refunded"
      ? payment.registration_id
        ? "successful"
        : "pending"
      : payment.status === "failed"
        ? "failed"
        : "pending";
  return NextResponse.json(
    { status, ...(payment.registration_id ? { registrationId: payment.registration_id } : {}) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
