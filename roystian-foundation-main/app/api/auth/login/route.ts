import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeSignIn } from "@/lib/server/sign-in";
import { readJson } from "@/lib/server/auth";
import { identityError, normaliseEmail, signIn } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { sessionMeta, setMfaCookie } from "@/lib/server/session";

const body = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});

export async function POST(req: NextRequest) {
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const email = normaliseEmail(parsed.data.email);

  const limited =
    rateLimit(`login-ip:${clientIp(req)}`, 200, 300) ?? rateLimit(`login-email:${email}`, 8, 300);
  if (limited) return limited;

  try {
    const result = await signIn(email, parsed.data.password, sessionMeta(req));
    if (result.kind === "mfa") {
      const response = NextResponse.json({ ok: false, mfaRequired: true });
      setMfaCookie(response.cookies, result.challenge);
      return response;
    }
    return completeSignIn(result.token, result.userId);
  } catch (error) {
    const name = identityError(error);
    const message = error instanceof Error ? error.message : "";
    if (name === "UserNotConfirmedException") {
      return NextResponse.json(
        { error: "Confirm your email address before signing in.", needsConfirmation: true },
        { status: 403 },
      );
    }
    if (name === "NotAuthorizedException" && /disabled/i.test(message)) {
      return NextResponse.json({ error: "This account is suspended. Contact the programme team." }, { status: 403 });
    }
    if (name === "LimitExceededException") {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes or reset your password." },
        { status: 429 },
      );
    }
    if (name === "NotAuthorizedException") {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    console.error("login failed:", name);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
