import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({ paymentId: z.string().uuid() });

/**
 * Records a refund. This updates our records only — the money itself must be
 * refunded in the payment gateway until refunds are wired to its API.
 * A refunded registration no longer counts as paid, so the student loses
 * access to that domain's coursework.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");

  const { data: payment } = await ctx.admin
    .from("payments")
    .select("id, status, registration_id")
    .eq("id", parsed.data.paymentId)
    .maybeSingle();
  if (!payment) return badRequest("Payment not found.", 404);
  if (payment.status !== "successful") return badRequest("Only successful payments can be refunded.", 409);

  const { error } = await ctx.admin.from("payments").update({ status: "refunded" }).eq("id", payment.id);
  if (error) return badRequest("Could not record the refund.", 500);
  if (payment.registration_id) {
    await ctx.admin
      .from("registrations")
      .update({ payment_status: "refunded" })
      .eq("id", payment.registration_id);
  }

  await audit(ctx, "payment.refund", "payment", payment.id, {
    registrationId: payment.registration_id,
  });
  return NextResponse.json({ ok: true });
}
