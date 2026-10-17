/**
 * A local stand-in for the Cashfree Payment Gateway (API 2023-08-01), for
 * development and automated tests. Dependency-free; state is in memory.
 *
 *   PORT=8787 CASHFREE_SECRET_KEY=... WEBHOOK_URL=http://localhost:3100/api/payment/webhook \
 *     node scripts/mock-cashfree.mjs
 *
 * Emulates:
 *   POST /pg/orders                  create order → payment_session_id
 *   GET  /pg/orders/:id              order status
 *   GET  /pg/orders/:id/payments     payments for the order
 *   POST /pg/orders/:id/refunds      refund (idempotent on refund_id)
 *   GET  /checkout/:session          hosted checkout page (Pay / Fail buttons)
 *   POST /checkout/:session/pay|fail completes, sends a signed webhook, redirects to return_url
 *   POST /__test/pay/:orderId        same as "pay" without a browser (JSON); ?fail=1 to fail
 *   GET  /__test/orders              every order, for test assertions
 *
 * Webhooks are signed exactly like Cashfree's:
 *   x-webhook-signature = Base64(HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY))
 */
import { createHmac, randomUUID } from "node:crypto";
import http from "node:http";

const PORT = Number(process.env.PORT ?? 8787);
const APP_ID = process.env.CASHFREE_APP_ID ?? "local-cashfree-app";
const SECRET = process.env.CASHFREE_SECRET_KEY ?? "local-cashfree-secret";
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "";

/** @type {Map<string, any>} */
const orders = new Map();
/** @type {Map<string, string>} session id → order id */
const sessions = new Map();

function send(res, status, body, headers = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json",
    ...headers,
  });
  res.end(text);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function authorised(req) {
  return req.headers["x-client-id"] === APP_ID && req.headers["x-client-secret"] === SECRET;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function publicOrder(order) {
  const { payments, refunds, ...rest } = order;
  void payments;
  void refunds;
  return rest;
}

async function deliverWebhook(order, type, payment) {
  const target = WEBHOOK_URL || order.order_meta?.notify_url;
  if (!target) return { delivered: false, reason: "no webhook url" };
  const body = JSON.stringify({
    data: {
      order: {
        order_id: order.order_id,
        order_amount: order.order_amount,
        order_currency: order.order_currency,
        order_tags: null,
      },
      payment: {
        cf_payment_id: payment.cf_payment_id,
        payment_status: payment.payment_status,
        payment_amount: payment.payment_amount,
        payment_currency: "INR",
        payment_message: payment.payment_message,
        payment_time: payment.payment_time,
        bank_reference: payment.bank_reference,
        auth_id: null,
        payment_method: { upi: { channel: "collect", upi_id: "success@upi" } },
        payment_group: payment.payment_group,
      },
      customer_details: order.customer_details,
      payment_gateway_details: { gateway_name: "CASHFREE" },
    },
    event_time: new Date().toISOString(),
    type,
  });
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", SECRET).update(timestamp + body).digest("base64");
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-timestamp": timestamp,
        "x-webhook-signature": signature,
        "x-webhook-version": "2023-08-01",
      },
      body,
    });
    return { delivered: true, status: res.status };
  } catch (error) {
    return { delivered: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function settle(order, outcome) {
  const success = outcome === "pay";
  const payment = {
    cf_payment_id: String(Math.floor(Math.random() * 1e12)),
    payment_status: success ? "SUCCESS" : "FAILED",
    payment_amount: order.order_amount,
    payment_message: success ? "Simulated success" : "Simulated failure",
    payment_time: new Date().toISOString(),
    bank_reference: String(Math.floor(Math.random() * 1e9)),
    payment_group: "upi",
  };
  order.payments.push(payment);
  if (success) order.order_status = "PAID";
  const webhook = await deliverWebhook(order, success ? "PAYMENT_SUCCESS_WEBHOOK" : "PAYMENT_FAILED_WEBHOOK", payment);
  return { payment, webhook };
}

function returnUrl(order) {
  return (order.order_meta?.return_url ?? "").replace("{order_id}", encodeURIComponent(order.order_id));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    // Gateway API -----------------------------------------------------------
    if (parts[0] === "pg") {
      if (!authorised(req)) return send(res, 401, { message: "authentication Failed", code: "request_failed", type: "authentication_error" });

      if (req.method === "POST" && parts.length === 2 && parts[1] === "orders") {
        const input = JSON.parse((await readBody(req)) || "{}");
        if (!input.order_id || !(Number(input.order_amount) >= 1) || !input.customer_details?.customer_phone) {
          return send(res, 400, { message: "order_id, order_amount and customer_phone are required", code: "request_invalid" });
        }
        if (orders.has(input.order_id)) {
          return send(res, 409, { message: "order with same id is already present", code: "order_already_exists" });
        }
        const session = `session_${randomUUID().replace(/-/g, "")}`;
        const order = {
          cf_order_id: String(Math.floor(Math.random() * 1e10)),
          order_id: input.order_id,
          order_amount: Number(input.order_amount),
          order_currency: input.order_currency ?? "INR",
          order_status: "ACTIVE",
          payment_session_id: session,
          customer_details: input.customer_details,
          order_meta: input.order_meta ?? {},
          created_at: new Date().toISOString(),
          payments: [],
          refunds: [],
        };
        orders.set(order.order_id, order);
        sessions.set(session, order.order_id);
        return send(res, 200, publicOrder(order));
      }

      const order = parts[1] === "orders" && parts[2] ? orders.get(decodeURIComponent(parts[2])) : null;
      if (parts[1] === "orders" && !order) return send(res, 404, { message: "order not found", code: "order_not_found" });

      if (req.method === "GET" && parts.length === 3) return send(res, 200, publicOrder(order));
      if (req.method === "GET" && parts[3] === "payments") return send(res, 200, order.payments);
      if (req.method === "POST" && parts[3] === "refunds") {
        const input = JSON.parse((await readBody(req)) || "{}");
        if (order.order_status !== "PAID") return send(res, 400, { message: "order is not paid", code: "request_invalid" });
        if (order.refunds.some((r) => r.refund_id === input.refund_id)) {
          return send(res, 409, { message: "refund with same id exists", code: "refund_already_exists" });
        }
        const refunded = order.refunds.reduce((sum, r) => sum + r.refund_amount, 0);
        if (refunded + Number(input.refund_amount) > order.order_amount) {
          return send(res, 400, { message: "refund amount exceeds order amount", code: "request_invalid" });
        }
        const refund = {
          cf_refund_id: String(Math.floor(Math.random() * 1e10)),
          refund_id: input.refund_id,
          order_id: order.order_id,
          refund_amount: Number(input.refund_amount),
          refund_note: input.refund_note ?? "",
          refund_status: "PENDING",
          created_at: new Date().toISOString(),
        };
        order.refunds.push(refund);
        return send(res, 200, refund);
      }
      return send(res, 404, { message: "not found" });
    }

    // Hosted checkout -------------------------------------------------------
    if (parts[0] === "checkout" && parts[1]) {
      const order = orders.get(sessions.get(parts[1]) ?? "");
      if (!order) return send(res, 404, "<h1>Unknown payment session</h1>");

      if (req.method === "GET" && parts.length === 2) {
        const amount = `₹${order.order_amount.toLocaleString("en-IN")}`;
        return send(
          res,
          200,
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cashfree (local mock) — ${escapeHtml(order.order_id)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:420px;margin:48px auto;padding:0 16px;color:#111}
.card{border:1px solid #ddd;border-radius:12px;padding:24px}button{width:100%;padding:12px;margin-top:12px;border-radius:8px;border:0;font-size:16px;cursor:pointer}
.pay{background:#5b3df5;color:#fff}.fail{background:#eee;color:#111}small{color:#666}</style></head>
<body><div class="card"><p><small>LOCAL MOCK — not the real Cashfree gateway</small></p>
<h1>Pay ${escapeHtml(amount)}</h1><p>Order <code>${escapeHtml(order.order_id)}</code><br>${escapeHtml(order.customer_details?.customer_email ?? "")}</p>
<form method="post" action="/checkout/${escapeHtml(parts[1])}/pay"><button class="pay" type="submit">Pay ${escapeHtml(amount)}</button></form>
<form method="post" action="/checkout/${escapeHtml(parts[1])}/fail"><button class="fail" type="submit">Fail payment</button></form>
</div></body></html>`,
        );
      }

      if (req.method === "POST" && (parts[2] === "pay" || parts[2] === "fail")) {
        if (order.order_status === "PAID") return send(res, 303, "", { Location: returnUrl(order) });
        await settle(order, parts[2]);
        return send(res, 303, "", { Location: returnUrl(order) });
      }
    }

    // Test hooks ------------------------------------------------------------
    if (parts[0] === "__test") {
      if (req.method === "POST" && parts[1] === "pay" && parts[2]) {
        const order = orders.get(decodeURIComponent(parts[2]));
        if (!order) return send(res, 404, { message: "order not found" });
        if (order.order_status === "PAID") return send(res, 409, { message: "order already paid" });
        const result = await settle(order, url.searchParams.get("fail") === "1" ? "fail" : "pay");
        return send(res, 200, { order: publicOrder(order), ...result });
      }
      if (req.method === "GET" && parts[1] === "orders") {
        return send(res, 200, [...orders.values()]);
      }
    }

    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
    return send(res, 404, { message: "not found" });
  } catch (error) {
    return send(res, 500, { message: error instanceof Error ? error.message : "error" });
  }
});

server.listen(PORT, () => {
  console.log(`mock Cashfree listening on :${PORT} (webhook → ${WEBHOOK_URL || "order notify_url"})`);
});
