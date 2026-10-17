import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { finishTotpEnrolment, identityError } from "@/lib/server/identity";
import { rateLimit } from "@/lib/server/rate-limit";
import { getAuthenticatedUser } from "@/lib/server/session";

const body = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

/** Confirms the authenticator app and makes it required at every sign-in. */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const limited = rateLimit(`mfa-enable:${user.id}`, 10, 300);
  if (limited) return limited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  try {
    await finishTotpEnrolment(user.id, parsed.data.code);
  } catch (error) {
    const name = identityError(error);
    if (name === "CodeMismatchException") {
      return NextResponse.json({ error: "That code is not correct. Check the time on your phone." }, { status: 400 });
    }
    return NextResponse.json({ error: "Start the setup again." }, { status: 409 });
  }

  await getSql()`update public.profiles set mfa_enabled = true where id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
