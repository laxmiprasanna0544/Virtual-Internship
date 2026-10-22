/**
 * Cashfree payments: who may start a checkout, prices from the catalogue,
 * signed webhooks (forged, replayed, tampered, failed), the order-status
 * reconciliation path, ownership of order status, and refunds through the
 * gateway with the student losing access afterwards.
 */
import { createHmac } from "node:crypto";
import {
  BASE,
  CASHFREE,
  check,
  Client,
  curriculum,
  enrol,
  env,
  finish,
  newStaff,
  newStudent,
  payOnGateway,
  section,
  sql,
  waitFor,
} from "./lib.mjs";

const { getProgram, moduleAssessments, correctAnswers } = curriculum();

/** Posts a webhook exactly as Cashfree does, optionally with a bad signature. */
async function sendWebhook(payload, { secret = env.CASHFREE_SECRET_KEY, signature, timestamp } = {}) {
  const raw = JSON.stringify(payload);
  const ts = timestamp ?? String(Date.now());
  const sig = signature ?? createHmac("sha256", secret).update(ts + raw).digest("base64");
  const headers = { "Content-Type": "application/json", "x-webhook-version": "2023-08-01" };
  if (signature !== null) {
    headers["x-webhook-timestamp"] = ts;
    headers["x-webhook-signature"] = sig;
  }
  const res = await fetch(`${BASE}/api/payment/webhook`, { method: "POST", headers, body: raw });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function successPayload(orderId, amountRupees, paymentId = `${Date.now()}`) {
  return {
    type: "PAYMENT_SUCCESS_WEBHOOK",
    event_time: new Date().toISOString(),
    data: {
      order: { order_id: orderId, order_amount: amountRupees, order_currency: "INR" },
      payment: {
        cf_payment_id: paymentId,
        payment_status: "SUCCESS",
        payment_amount: amountRupees,
        payment_group: "upi",
      },
    },
  };
}

const paymentRow = async (orderId) => (await sql`select * from public.payments where provider_order_id = ${orderId}`)[0];

section("Who may start a checkout");
const anon = new Client("pay-anon");
let res = await anon.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner" });
check("signed-out create-order → 401", res.status === 401, res.status);

const staffClient = new Client("pay-staff");
await newStaff(staffClient, "admin");
res = await staffClient.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner" });
check("staff account cannot check out (403)", res.status === 403, res.status);

const buyer = new Client("pay-buyer");
const buyerAccount = await newStudent(buyer, { name: "Payment Buyer" });
res = await buyer.post("/api/payment/create-order", { domainId: "no-such-domain", programId: "self-paced", experience: "beginner" });
check("unknown domain → 400", res.status === 400, res.status);
res = await buyer.post("/api/payment/create-order", { domainId: "ai-ml", programId: "free-forever", experience: "beginner" });
check("unknown programme → 400", res.status === 400, res.status);
res = await buyer.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner", amount: 1 });
check("checkout starts for a student", res.status === 200 && res.json?.orderId && res.json?.paymentSessionId, res.text);
check("mock environment returns a hosted checkout URL", res.json?.environment === "mock" && res.json?.checkoutUrl?.startsWith(CASHFREE), res.json);

const noMobile = new Client("pay-no-mobile");
await newStudent(noMobile, { mobile: "" });
res = await noMobile.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner" });
check("missing mobile → 400 mobile_required", res.status === 400 && res.json?.code === "mobile_required", res.text);

section("Amounts come from the catalogue");
for (const programId of ["self-paced", "industry-led"]) {
  const c = new Client(`pay-price-${programId}`);
  await newStudent(c);
  res = await c.post("/api/payment/create-order", { domainId: "data-analytics", programId, experience: "beginner", amount: 1, amountPaise: 100 });
  const row = await paymentRow(res.json?.orderId);
  check(`${programId}: pending payment at the catalogue price`, row?.status === "pending" && row?.amount_paise === getProgram(programId).price * 100, row?.amount_paise);
  const orders = await (await fetch(`${CASHFREE}/__test/orders`)).json();
  const gw = orders.find((o) => o.order_id === res.json?.orderId);
  check(`${programId}: gateway order amount matches the catalogue`, Number(gw?.order_amount) === getProgram(programId).price, gw?.order_amount);
}

section("Webhook signatures");
res = await buyer.post("/api/payment/create-order", { domainId: "python-development", programId: "self-paced", experience: "beginner" });
const forgedOrder = res.json.orderId;
const price = getProgram("self-paced").price;
let hook = await sendWebhook(successPayload(forgedOrder, price), { signature: null });
check("webhook without signature → 401", hook.status === 401, hook.status);
hook = await sendWebhook(successPayload(forgedOrder, price), { secret: "attacker-guess" });
check("webhook signed with the wrong secret → 401", hook.status === 401, hook.status);
hook = await sendWebhook(successPayload(forgedOrder, price), { signature: "AAAA" });
check("webhook with a garbage signature → 401", hook.status === 401, hook.status);
const afterForged = await paymentRow(forgedOrder);
check("forged webhooks change nothing", afterForged.status === "pending" && afterForged.registration_id === null, afterForged.status);

section("Tampered amount");
hook = await sendWebhook(successPayload(forgedOrder, 1));
const afterTamper = await paymentRow(forgedOrder);
check("validly signed webhook with the wrong amount is not accepted", hook.json?.ok === false, hook.json);
check("payment stays unpaid after an amount mismatch", afterTamper.status === "pending" && afterTamper.registration_id === null, afterTamper);

section("Signed webhook, replayed");
const replayPayload = successPayload(forgedOrder, price, "cf-replay-1");
hook = await sendWebhook(replayPayload);
check("valid signed webhook completes the payment", hook.status === 200 && hook.json?.ok === true, hook.json);
for (let i = 0; i < 3; i += 1) await sendWebhook(replayPayload);
const regs = await sql`select id from public.registrations where student_id = ${buyerAccount.id} and domain_id = 'python-development'`;
check("replays create exactly one registration", regs.length === 1, regs.length);
const notes = await sql`select id from public.notifications where user_id = ${buyerAccount.id} and title = 'Registration confirmed'`;
check("replays send exactly one notification", notes.length === 1, notes.length);
const mails = await sql`select id from public.communication_logs where recipient = ${buyerAccount.email} and event = 'payment-success'`;
check("replays send exactly one email", mails.length === 1, mails.length);
const paid = await paymentRow(forgedOrder);
check("payment linked to the registration", paid.status === "successful" && paid.registration_id === regs[0]?.id, paid);

res = await buyer.post("/api/payment/create-order", { domainId: "python-development", programId: "self-paced", experience: "beginner" });
check("already enrolled → 409", res.status === 409, res.status);

section("Failed payment");
res = await buyer.post("/api/payment/create-order", { domainId: "java-development", programId: "self-paced", experience: "beginner" });
const failingOrder = res.json?.orderId;
const failed = await payOnGateway(failingOrder, { fail: true });
check("gateway reports the failure", failed.status === 200, failed.status);
const failedRow = await waitFor(async () => {
  const row = await paymentRow(failingOrder);
  return row?.status === "failed" ? row : null;
});
check("PAYMENT_FAILED_WEBHOOK marks the payment failed", failedRow?.status === "failed", failedRow?.status);
res = await buyer.get(`/api/payment/verify?orderId=${failingOrder}`);
check("verify reports failed", res.json?.status === "failed", res.text);

section("Order status belongs to its owner");
const other = new Client("pay-other");
await newStudent(other);
res = await other.get(`/api/payment/verify?orderId=${forgedOrder}`);
check("another student's order → 404", res.status === 404, res.status);
res = await anon.get(`/api/payment/verify?orderId=${forgedOrder}`);
check("signed-out verify → 401", res.status === 401, res.status);

section("Reconciliation when the webhook never arrives");
const recon = new Client("pay-recon");
const reconAccount = await newStudent(recon);
res = await recon.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner" });
const reconOrder = res.json.orderId;
// Hide the order from the webhook, so only the status check can complete it.
await sql`update public.payments set provider_order_id = ${reconOrder + "-HIDDEN"} where provider_order_id = ${reconOrder}`;
await payOnGateway(reconOrder);
await sql`update public.payments set provider_order_id = ${reconOrder} where provider_order_id = ${reconOrder + "-HIDDEN"}`;
const beforeVerify = await paymentRow(reconOrder);
check("webhook could not complete the hidden order", beforeVerify.status === "pending", beforeVerify.status);
res = await recon.get(`/api/payment/verify?orderId=${reconOrder}`);
check("verify asks Cashfree for the order and completes it", res.json?.status === "successful" && res.json?.registrationId, res.text);
const reconRow = await paymentRow(reconOrder);
check("reconciled payment recorded with the gateway payment id", reconRow.status === "successful" && reconRow.provider_payment_id, reconRow);

section("Refunds");
const learner = new Client("pay-refund");
const learnerAccount = await newStudent(learner);
const { orderId: refundOrder, registrationId: refundReg } = await enrol(learner, "ai-ml", "self-paced");
const refundPayment = await paymentRow(refundOrder);
const firstAssessment = moduleAssessments("ai-ml")[0];
res = await learner.get(`/api/assessments/${firstAssessment.id}`);
check("enrolled student can open assessments", res.status === 200, res.status);

res = await learner.post("/api/admin/payments/refund", { paymentId: refundPayment.id });
check("student cannot refund (403)", res.status === 403, res.status);
const trainer = new Client("pay-trainer");
await newStaff(trainer, "trainer", { trainerDomains: ["ai-ml"] });
res = await trainer.post("/api/admin/payments/refund", { paymentId: refundPayment.id });
check("trainer cannot refund (403)", res.status === 403, res.status);

res = await staffClient.post("/api/admin/payments/refund", { paymentId: refundPayment.id });
check("admin refund succeeds", res.status === 200 && res.json?.ok, res.text);
const orders = await (await fetch(`${CASHFREE}/__test/orders`)).json();
const gwRefunds = orders.find((o) => o.order_id === refundOrder)?.refunds ?? [];
check("refund issued at the gateway", gwRefunds.length === 1 && gwRefunds[0].refund_id === `RFND-${refundPayment.id}`, gwRefunds);
const refunded = await paymentRow(refundOrder);
check("payment marked refunded with the refund id", refunded.status === "refunded" && refunded.refund_id === `RFND-${refundPayment.id}` && refunded.refunded_at, refunded);
const [refundedReg] = await sql`select payment_status from public.registrations where id = ${refundReg}`;
check("registration marked refunded", refundedReg?.payment_status === "refunded", refundedReg);
const auditRows = await sql`select * from public.admin_audit_log where action = 'payment.refund' and target_id = ${refundPayment.id}`;
check("refund written to the audit log", auditRows.length === 1 && auditRows[0].actor_id, auditRows.length);
res = await learner.get(`/api/assessments/${firstAssessment.id}`);
check("refunded student loses access to the coursework (403)", res.status === 403, res.status);
res = await staffClient.post("/api/admin/payments/refund", { paymentId: refundPayment.id });
check("repeated refund is idempotent", res.status === 200 && res.json?.alreadyRefunded === true, res.text);
const after = (await (await fetch(`${CASHFREE}/__test/orders`)).json()).find((o) => o.order_id === refundOrder);
check("no second refund at the gateway", after?.refunds?.length === 1, after?.refunds?.length);
res = await staffClient.post("/api/admin/payments/refund", { paymentId: failedRow.id });
check("a failed payment cannot be refunded (409)", res.status === 409, res.status);
section("Guided programme after self-paced starts the domain fresh");
const restarter = new Client("guided-restart");
const restarterAccount = await newStudent(restarter, { name: "Guided Restart" });
const selfPaced = await enrol(restarter, "data-analytics", "self-paced");
const firstAnalytics = moduleAssessments("data-analytics")[0];
res = await restarter.post("/api/assessments/submit", { assessmentId: firstAnalytics.id, answers: correctAnswers(firstAnalytics) });
check("self-paced work recorded", res.json?.attempt?.passed === true, res.text);

res = await restarter.post("/api/payment/create-order", { domainId: "data-analytics", programId: "self-paced", experience: "beginner" });
check("the same programme twice in one domain → 409", res.status === 409, res.status);

const guided = await enrol(restarter, "data-analytics", "industry-led");
check("guided enrolment is a new registration", Boolean(guided.registrationId) && guided.registrationId !== selfPaced.registrationId, guided);
const [restarterRow] = await sql`select active_registration_id, program_id from public.students where id = ${restarterAccount.id}`;
check("guided enrolment is the active one", restarterRow?.active_registration_id === guided.registrationId && restarterRow?.program_id === "industry-led", restarterRow);
const [{ count: liveAttempts }] = await sql`
  select count(*)::int as count from public.assessment_attempts
  where student_id = ${restarterAccount.id} and domain_id = 'data-analytics'`;
check("the guided enrolment starts with no assessment attempts", liveAttempts === 0, liveAttempts);
const [freshProgress] = await sql`
  select completed_modules from public.module_progress
  where student_id = ${restarterAccount.id} and domain_id = 'data-analytics'`;
check("the guided enrolment starts with no completed modules", freshProgress?.completed_modules?.length === 0, freshProgress);
const archived = await sql`
  select source_table, registration_id from public.enrolment_archive where student_id = ${restarterAccount.id}`;
check(
  "self-paced attempts and progress are archived against the self-paced registration",
  ["assessment_attempts", "module_progress"].every((t) =>
    archived.some((r) => r.source_table === t && r.registration_id === selfPaced.registrationId),
  ),
  archived,
);

res = await restarter.post("/api/payment/create-order", { domainId: "data-analytics", programId: "industry-led", experience: "beginner" });
check("guided twice in one domain → 409", res.status === 409, res.status);
res = await restarter.post("/api/payment/create-order", { domainId: "data-analytics", programId: "self-paced", experience: "beginner" });
check("no move back down to self-paced → 409", res.status === 409, res.status);

void learnerAccount;
void reconAccount;

await finish("payments");
