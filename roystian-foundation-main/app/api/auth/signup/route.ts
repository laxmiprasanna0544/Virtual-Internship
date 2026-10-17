import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { deleteUser, identityError, normaliseEmail, signUp } from "@/lib/server/identity";
import { getSql, pgCode, UNIQUE_VIOLATION } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(256),
  mobile: z.string().trim().max(20).optional().default(""),
  college: z.string().trim().max(200).optional().default(""),
  course: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  educationLevel: z
    .enum(["intermediate", "diploma", "undergraduate", "postgraduate", "working-professional"])
    .optional()
    .default("undergraduate"),
});

/**
 * Creates an account and the matching student records. Every sign-up is a
 * student; staff roles are granted by an administrator. A verification code
 * is emailed, which /api/auth/confirm accepts.
 */
export async function POST(req: NextRequest) {
  // Per-IP limits are generous because a college lab often shares one public
  // address; per-email limits stop abuse of a single account.
  const ipLimited = rateLimit(`signup:${clientIp(req)}`, 60, 600);
  if (ipLimited) return ipLimited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const email = normaliseEmail(input.email);
  const emailLimited = rateLimit(`signup-email:${email}`, 3, 600);
  if (emailLimited) return emailLimited;

  let sub: string;
  try {
    sub = await signUp({ email, password: input.password });
  } catch (error) {
    const name = identityError(error);
    if (name === "UsernameExistsException") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    if (name === "InvalidPasswordException") {
      return NextResponse.json(
        { error: "Use at least 10 characters with upper and lower case letters and a number." },
        { status: 400 },
      );
    }
    if (name === "EmailNotConfiguredError") {
      return NextResponse.json({ error: "Sign-up is temporarily unavailable." }, { status: 503 });
    }
    console.error("signup failed:", name);
    return NextResponse.json({ error: "Unable to create the account. Please try again." }, { status: 502 });
  }

  try {
    await getSql()`select public.provision_student(
      ${sub}, ${email}, ${input.name}, ${input.mobile}, ${input.college},
      ${input.course}, ${input.city}, ${input.educationLevel})`;
  } catch (error) {
    // Keep the account and the profile in step: undo the account.
    console.error("provision_student failed:", pgCode(error));
    await deleteUser(sub).catch((e) => console.error("signup rollback failed:", identityError(e)));
    return NextResponse.json(
      {
        error:
          pgCode(error) === UNIQUE_VIOLATION
            ? "An account with this email already exists."
            : "Unable to create the account. Please try again.",
      },
      { status: pgCode(error) === UNIQUE_VIOLATION ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true, needsConfirmation: true });
}
