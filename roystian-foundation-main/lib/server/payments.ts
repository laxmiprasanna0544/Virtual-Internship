import "server-only";

import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { domainCode } from "@/lib/ids";
import { getOrder, getOrderPayments, paymentMethodFromGroup } from "@/lib/server/cashfree";
import { service } from "@/lib/server/db";
import { notify, sendCommunication } from "@/lib/server/notify";
import type { Json } from "@/types/db";
import type { ProgramId } from "@/types";

/**
 * Turning a confirmed Cashfree payment into an enrolment. Shared by the
 * signed webhook and the server-side order status check, whichever arrives
 * first; complete_payment() makes the second one a no-op.
 */

export type Completion =
  | { ok: true; registrationId: string; created: boolean }
  | { ok: false; reason: "unknown-order" | "rejected" };

export async function completePaidOrder(input: {
  orderId: string;
  amountPaise: number;
  method: "upi" | "card" | "netbanking";
  providerPaymentId: string | null;
  payload: Json;
}): Promise<Completion> {
  let result: { registrationId: string; created: boolean; studentId: string; domainId: string; programId: string };
  try {
    result = await service(async (tx) => {
      const [pending] = await tx<{ registration_id: string | null; domain_id: string | null; student_id: string; program_id: string | null }[]>`
        select registration_id, domain_id, student_id, program_id
        from public.payments where provider_order_id = ${input.orderId}`;
      if (!pending) throw Object.assign(new Error("unknown order"), { code: "P0002" });
      const [registration] = await tx<{ id: string; domain_id: string; program_id: string }[]>`
        select id, domain_id, program_id from public.complete_payment(
          ${input.orderId}, ${input.amountPaise}, ${input.method}, ${input.providerPaymentId},
          ${tx.json(input.payload as never)}, ${domainCode(pending.domain_id)})`;
      // Newly linked by this call (a duplicate payment stays unlinked for a refund).
      const [after] = await tx<{ registration_id: string | null }[]>`
        select registration_id from public.payments where provider_order_id = ${input.orderId}`;
      return {
        registrationId: registration.id,
        created: pending.registration_id === null && after?.registration_id === registration.id,
        studentId: pending.student_id,
        domainId: registration.domain_id,
        programId: registration.program_id,
      };
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    console.error("complete_payment failed:", input.orderId, code, error instanceof Error ? error.message : "");
    return { ok: false, reason: code === "P0002" ? "unknown-order" : "rejected" };
  }

  if (result.created) await announceEnrolment(result.studentId, result.registrationId, result.domainId, result.programId);
  return { ok: true, registrationId: result.registrationId, created: result.created };
}

export async function failOrder(orderId: string, reason: string, payload: Json): Promise<void> {
  await service((tx) => tx`select public.fail_payment(${orderId}, ${reason}, ${tx.json(payload as never)})`);
}

async function announceEnrolment(studentId: string, registrationId: string, domainId: string, programId: string) {
  const domain = getDomain(domainId);
  const program = getProgram(programId as ProgramId);
  const [profile] = await service((tx) =>
    tx<{ email: string; full_name: string }[]>`select email, full_name from public.profiles where id = ${studentId}`,
  );
  const first = profile?.full_name.split(" ")[0] || "there";
  await Promise.all([
    notify(
      studentId,
      "success",
      "Registration confirmed",
      `Your ${domain?.name ?? "internship"} virtual internship is active. Registration ID ${registrationId}.`,
      "/dashboard",
    ),
    profile
      ? sendCommunication({
          event: "payment-success",
          recipient: profile.email,
          subject: `Welcome to Roystian Foundation — ${domain?.name ?? "Virtual"} Internship`,
          body: `Hi ${first},\n\nYour payment was received and registration ${registrationId} for the ${program?.name ?? "programme"} is confirmed. Your dashboard is now active.\n\nRoystian Foundation`,
        })
      : Promise.resolve(),
  ]);
}

/**
 * Asks Cashfree for the order's state and completes it if it was paid. Used
 * when the student returns from checkout before the webhook has arrived.
 */
export async function reconcileOrder(orderId: string): Promise<"successful" | "pending" | "failed"> {
  const order = await getOrder(orderId);
  if (order.order_status === "PAID") {
    const payments = await getOrderPayments(orderId);
    const paid = payments.find((p) => p.payment_status === "SUCCESS");
    if (!paid) return "pending";
    const done = await completePaidOrder({
      orderId,
      amountPaise: Math.round(Number(paid.payment_amount ?? order.order_amount) * 100),
      method: paymentMethodFromGroup(paid.payment_group),
      providerPaymentId: String(paid.cf_payment_id),
      payload: { source: "order-status", order, payment: paid } as unknown as Json,
    });
    return done.ok ? "successful" : "pending";
  }
  if (order.order_status === "EXPIRED" || order.order_status === "TERMINATED") {
    await failOrder(orderId, `order ${order.order_status.toLowerCase()}`, { source: "order-status", order } as unknown as Json);
    return "failed";
  }
  const payments = await getOrderPayments(orderId).catch(() => []);
  if (payments.length && payments.every((p) => p.payment_status === "FAILED" || p.payment_status === "USER_DROPPED")) {
    return "failed";
  }
  return "pending";
}
