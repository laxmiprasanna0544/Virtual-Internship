import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CashfreeError, createRefund } from "@/lib/server/cashfree";
import { getSql, service } from "@/lib/server/db";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({ paymentId: z.string().uuid() });

/**
 * Refunds a payment through Cashfree, then records it. The refund id is
 * derived from the payment, so a repeated request cannot refund twice.
 * A refunded registration no longer counts as paid, so the student loses
 * access to that domain's coursework.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");

  const [payment] = await getSql()<
    { id: string; status: string; provider: string; provider_order_id: string; amount_paise: number; student_id: string; registration_id: string | null }[]
  >`
    select id, status, provider, provider_order_id, amount_paise, student_id, registration_id
    from public.payments where id = ${parsed.data.paymentId}`;
  if (!payment) return badRequest("Payment not found.", 404);
  if (payment.status === "refunded") return NextResponse.json({ ok: true, alreadyRefunded: true });
  if (payment.status !== "successful") return badRequest("Only successful payments can be refunded.", 409);
  if (payment.provider !== "cashfree") return badRequest("This payment was not taken through Cashfree.", 409);

  const refundId = `RFND-${payment.id}`;
  let refund;
  try {
    refund = await createRefund({
      orderId: payment.provider_order_id,
      refundId,
      amountRupees: payment.amount_paise / 100,
      note: "Refund issued by Roystian Foundation",
    });
  } catch (error) {
    // Cashfree reports a repeated refund id as a conflict: it already exists.
    if (!(error instanceof CashfreeError && error.status === 409)) {
      console.error("Cashfree refund failed:", error instanceof CashfreeError ? `${error.status} ${error.code ?? ""}` : error);
      return badRequest("The gateway did not accept the refund. Nothing was changed.", 502);
    }
    refund = { refund_id: refundId, refund_status: "EXISTING" };
  }

  try {
    await service((tx) => tx`select public.record_refund(${payment.id}, ${refundId}, ${tx.json(refund as never)})`);
  } catch (error) {
    console.error("record_refund failed:", error instanceof Error ? error.message : error);
    return badRequest("The refund was issued but could not be recorded. Retry to record it.", 500);
  }

  await Promise.all([
    notify(payment.student_id, "system", "Refund issued", "Your payment has been refunded to the original payment method.", "/dashboard"),
    audit(ctx, "payment.refund", "payment", payment.id, {
      registrationId: payment.registration_id,
      refundId,
    }),
  ]);
  return NextResponse.json({ ok: true });
}
