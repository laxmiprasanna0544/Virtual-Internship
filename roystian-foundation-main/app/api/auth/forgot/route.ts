import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, forgotPassword } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({ email: z.string().trim().email().max(254) });

/**
 * Emails a password reset code. Always reports success, so the form cannot be
 * used to discover which addresses have accounts.
 */
export async function POST(req: NextRequest) {
  const ipLimited = rateLimit(`forgot:${clientIp(req)}`, 60, 600);
  if (ipLimited) return ipLimited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const emailLimited = rateLimit(`forgot-email:${parsed.data.email.toLowerCase()}`, 3, 600);
  if (emailLimited) return emailLimited;
  await forgotPassword(parsed.data.email).catch((error) => {
    const name = identityError(error);
    if (name !== "UserNotFoundException") console.error("forgot password failed:", name);
  });
  return NextResponse.json({ ok: true });
}
