import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, confirmForgotPassword } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
  password: z.string().min(10).max(256),
});

/** Sets a new password with the code from the reset email. */
export async function POST(req: NextRequest) {
  const ipLimited = rateLimit(`reset:${clientIp(req)}`, 100, 600);
  if (ipLimited) return ipLimited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  const emailLimited = rateLimit(`reset-email:${parsed.data.email.toLowerCase()}`, 10, 600);
  if (emailLimited) return emailLimited;
  try {
    await confirmForgotPassword(parsed.data.email, parsed.data.code, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const name = identityError(error);
    if (name === "CodeMismatchException" || name === "ExpiredCodeException") {
      return NextResponse.json({ error: "That code is not valid or has expired. Request a new one." }, { status: 400 });
    }
    if (name === "InvalidPasswordException") {
      return NextResponse.json(
        { error: "Use at least 10 characters with upper and lower case letters and a number." },
        { status: 400 },
      );
    }
    if (name === "LimitExceededException") {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    return NextResponse.json({ error: "That code is not valid or has expired. Request a new one." }, { status: 400 });
  }
}
