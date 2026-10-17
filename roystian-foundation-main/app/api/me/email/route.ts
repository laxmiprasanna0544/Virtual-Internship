import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { identityError, requestEmailChange } from "@/lib/server/identity";
import { rateLimit } from "@/lib/server/rate-limit";
import { getAuthenticatedUser } from "@/lib/server/session";

const body = z.object({ email: z.string().trim().email().max(254) });

/**
 * Starts an email change. A code goes to the new address; the current
 * address stays in use until /api/me/email/confirm verifies it.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const limited = rateLimit(`email-change:${user.id}`, 5, 600);
  if (limited) return limited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  try {
    await requestEmailChange(user.id, parsed.data.email);
    return NextResponse.json({ ok: true, codeSent: true });
  } catch (error) {
    const name = identityError(error);
    if (name === "AliasExistsException") {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }
    console.error("email change failed:", name);
    return NextResponse.json({ error: "The email address could not be changed." }, { status: 503 });
  }
}
