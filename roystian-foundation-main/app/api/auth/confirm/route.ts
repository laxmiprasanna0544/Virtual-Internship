import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, confirmSignUp } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
});

/** Confirms the email address with the code emailed at sign-up. */
export async function POST(req: NextRequest) {
  const ipLimited = rateLimit(`confirm:${clientIp(req)}`, 100, 600);
  if (ipLimited) return ipLimited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid code." }, { status: 400 });
  }
  const emailLimited = rateLimit(`confirm-email:${parsed.data.email.toLowerCase()}`, 10, 600);
  if (emailLimited) return emailLimited;
  try {
    await confirmSignUp(parsed.data.email, parsed.data.code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const name = identityError(error);
    if (name === "CodeMismatchException") {
      return NextResponse.json({ error: "That code is not correct." }, { status: 400 });
    }
    if (name === "ExpiredCodeException") {
      return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
    }
    if (name === "NotAuthorizedException") {
      // Already confirmed.
      return NextResponse.json({ ok: true });
    }
    console.error("confirm failed:", name);
    return NextResponse.json({ error: "Unable to confirm the account. Please try again." }, { status: 400 });
  }
}
