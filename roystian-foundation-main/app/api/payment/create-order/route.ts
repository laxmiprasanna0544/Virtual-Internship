import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { rupeesToPaise } from "@/lib/records/mappers";
import { readJson, requireStudent } from "@/lib/server/auth";
import { CashfreeError, cashfreeConfig, createOrder } from "@/lib/server/cashfree";
import { getSql, service } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  domainId: z.string().min(1).max(100),
  programId: z.enum(["self-paced", "industry-led"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
});

function siteUrl(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").origin;
  } catch {
    return null;
  }
}

/** Indian mobile number as Cashfree wants it: the last 10 digits. */
function tenDigitPhone(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");
  const phone = digits.slice(-10);
  return phone.length === 10 ? phone : null;
}

/**
 * Starts a Cashfree checkout for the signed-in student. The amount comes from
 * the server-side catalogue; the order is recorded as a pending payment and
 * only a verified gateway confirmation turns it into an enrolment.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const limited = rateLimit(`create-order:${userId}`, 10, 600);
  if (limited) return limited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  const { domainId, programId, experience } = parsed.data;

  const domain = getDomain(domainId);
  const program = getProgram(programId);
  if (!domain?.active || !program?.active) {
    return NextResponse.json({ error: "That programme is not available." }, { status: 400 });
  }

  const site = siteUrl();
  let config;
  try {
    config = cashfreeConfig();
  } catch (error) {
    console.error("Cashfree is not configured:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Online payment is not available right now." }, { status: 503 });
  }
  if (!site) {
    console.error("NEXT_PUBLIC_SITE_URL is not set; cannot build Cashfree return URLs");
    return NextResponse.json({ error: "Online payment is not available right now." }, { status: 503 });
  }

  const sql = getSql();
  const [profile] = await sql<{ full_name: string; email: string; mobile: string }[]>`
    select p.full_name, p.email, s.mobile
    from public.profiles p join public.students s on s.id = p.id
    where p.id = ${userId}`;
  if (!profile) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const [existing] = await sql`
    select 1 from public.registrations
    where student_id = ${userId} and domain_id = ${domain.id} and payment_status = 'successful'
    limit 1`;
  if (existing) {
    return NextResponse.json({ error: "You are already enrolled in this domain." }, { status: 409 });
  }

  const phone = tenDigitPhone(profile.mobile);
  if (!phone) {
    return NextResponse.json(
      { error: "Add a 10-digit mobile number to your profile before paying.", code: "mobile_required" },
      { status: 400 },
    );
  }

  const orderId = `RF${Date.now()}${randomBytes(4).toString("hex")}`.toUpperCase();
  const amountPaise = rupeesToPaise(program.price);

  await service(
    (tx) => tx`
      insert into public.payments (
        student_id, amount_paise, status, provider, provider_order_id, domain_id, program_id, experience
      ) values (
        ${userId}, ${amountPaise}, 'pending', 'cashfree', ${orderId}, ${domain.id}, ${program.id}, ${experience}
      )`,
  );

  try {
    const order = await createOrder({
      orderId,
      amountRupees: amountPaise / 100,
      customer: {
        // Cashfree customer ids allow alphanumerics, _ and -.
        id: userId.replace(/[^a-zA-Z0-9_-]/g, ""),
        name: profile.full_name.slice(0, 100) || "Student",
        email: profile.email,
        phone,
      },
      returnUrl: `${site}/payment/status?order_id={order_id}`,
      notifyUrl: `${site}/api/payment/webhook`,
    });
    return NextResponse.json(
      {
        orderId,
        paymentSessionId: order.payment_session_id,
        environment: config.environment,
        ...(config.mockOrigin
          ? { checkoutUrl: `${config.mockOrigin}/checkout/${encodeURIComponent(order.payment_session_id)}` }
          : {}),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Cashfree create order failed:",
      error instanceof CashfreeError ? `${error.status} ${error.code ?? ""}` : error instanceof Error ? error.message : error,
    );
    await service(
      (tx) => tx`select public.fail_payment(${orderId}, 'order could not be created', ${tx.json({ source: "create-order" })})`,
    ).catch(() => undefined);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
  }
}
