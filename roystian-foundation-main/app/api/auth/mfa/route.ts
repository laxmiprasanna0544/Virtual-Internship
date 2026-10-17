import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeSignIn } from "@/lib/server/sign-in";
import { readJson } from "@/lib/server/auth";
import { answerMfa, identityError } from "@/lib/server/identity";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { MFA_COOKIE, sessionMeta } from "@/lib/server/session";

const body = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

/** Second step of sign-in for accounts with an authenticator app. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`mfa:${clientIp(req)}`, 100, 300);
  if (limited) return limited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const challenge = req.cookies.get(MFA_COOKIE)?.value ?? "";
  if (!challenge) {
    return NextResponse.json({ error: "Your sign-in timed out. Enter your password again." }, { status: 401 });
  }

  try {
    const { token, userId } = await answerMfa(challenge, parsed.data.code, sessionMeta(req));
    return completeSignIn(token, userId);
  } catch (error) {
    const name = identityError(error);
    if (name === "CodeMismatchException") {
      return NextResponse.json({ error: "That code is not correct." }, { status: 400 });
    }
    return NextResponse.json({ error: "Your sign-in timed out. Enter your password again." }, { status: 401 });
  }
}
