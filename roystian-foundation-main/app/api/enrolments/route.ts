import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { domainCode } from "@/lib/ids";
import { notify, queueCommunication } from "@/lib/server/notify";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import { rupeesToPaise, toRegistration, toStudent } from "@/lib/supabase/mappers";

/**
 * Enrols the signed-in student in a domain and programme.
 *
 * TEMPORARY: payment is simulated, so this route is only enabled when
 * PAYMENT_MODE=simulated (the default outside production). In production it
 * refuses every request until the Cashfree webhook replaces it — otherwise
 * anyone could enrol for free.
 */
function simulatedPaymentsEnabled(): boolean {
  const mode = process.env.PAYMENT_MODE;
  if (mode) return mode === "simulated";
  return process.env.NODE_ENV !== "production";
}

const body = z.object({
  domainId: z.string().min(1),
  programId: z.enum(["self-paced", "industry-led"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  method: z.enum(["upi", "card", "netbanking"]),
});

export async function POST(req: NextRequest) {
  if (!simulatedPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Online payment is not available yet. Please try again later." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enrolment details." }, { status: 400 });
  }
  const { domainId, programId, experience, method } = parsed.data;

  const domain = getDomain(domainId);
  const program = getProgram(programId);
  if (!domain?.active || !program?.active) {
    return NextResponse.json({ error: "That programme is not available." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const [{ data: profile }, { data: studentRow }, { data: existing }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("students").select("*").eq("id", user.id).single(),
    admin
      .from("registrations")
      .select("id")
      .eq("student_id", user.id)
      .eq("domain_id", domainId)
      .eq("payment_status", "successful")
      .maybeSingle(),
  ]);
  if (!profile || profile.role !== "student" || !studentRow) {
    return NextResponse.json({ error: "Only student accounts can enrol." }, { status: 403 });
  }
  if (existing) {
    return NextResponse.json(
      { error: "You are already enrolled in this domain." },
      { status: 409 },
    );
  }

  // The price always comes from the server-side catalogue, never the client.
  const { data: registration, error } = await admin.rpc("create_paid_registration", {
    p_student_id: user.id,
    p_domain_id: domain.id,
    p_domain_code: domainCode(domain.id),
    p_program_id: program.id,
    p_experience: experience,
    p_amount_paise: rupeesToPaise(program.price),
    p_method: method,
    p_provider: "simulated",
    p_provider_order_id: `SIM-${crypto.randomUUID()}`,
  });
  if (error || !registration) {
    console.error("create_paid_registration failed:", error?.message);
    return NextResponse.json({ error: "Enrolment failed. Please try again." }, { status: 500 });
  }

  const student = toStudent(profile, studentRow);
  const first = student.name.split(" ")[0] || "there";
  await Promise.all([
    notify(
      admin,
      user.id,
      "success",
      "Registration confirmed",
      `Your ${domain.name} virtual internship is active. Registration ID ${registration.id}.`,
      "/dashboard",
    ),
    queueCommunication(admin, {
      event: "payment-success",
      channel: "email",
      recipient: student.email,
      subject: `Welcome to Roystian Foundation — ${domain.name} Virtual Internship`,
      body: `Hi ${first}, your registration ${registration.id} for the ${program.name} is confirmed. Your dashboard is now active.`,
    }),
    student.mobile
      ? queueCommunication(admin, {
          event: "payment-success",
          channel: "whatsapp",
          recipient: student.mobile,
          subject: "Registration confirmed",
          body: `Hi ${first}, your Roystian virtual internship (${domain.name}) is confirmed. Registration ID ${registration.id}.`,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ registration: toRegistration(registration, student) });
}
