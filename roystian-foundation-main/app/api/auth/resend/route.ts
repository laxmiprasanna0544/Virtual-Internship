import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, resendConfirmation } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

const body = z.object({ email: z.string().trim().email().max(254) });

/** Sends a fresh confirmation code. Always reports success. */
export async function POST(req: NextRequest) {
  const ipLimited = rateLimit(`resend:${clientIp(req)}`, 60, 600);
  if (ipLimited) return ipLimited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const emailLimited = rateLimit(`resend-email:${parsed.data.email.toLowerCase()}`, 3, 600);
  if (emailLimited) return emailLimited;
  await resendConfirmation(parsed.data.email).catch((error) => {
    console.error("resend failed:", identityError(error));
  });
  return NextResponse.json({ ok: true });
}
