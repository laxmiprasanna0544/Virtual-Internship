import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { pgCode, UNIQUE_VIOLATION } from "@/lib/server/db";
import { confirmEmailChange, identityError } from "@/lib/server/identity";
import { rateLimit } from "@/lib/server/rate-limit";
import { getAuthenticatedUser } from "@/lib/server/session";

const body = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

/**
 * Verifies the code sent to the new address, then switches the account and
 * profile to it. The address comes from the pending change recorded on the
 * server — never from this request.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const limited = rateLimit(`email-confirm:${user.id}`, 10, 600);
  if (limited) return limited;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  try {
    const email = await confirmEmailChange(user.id, parsed.data.code);
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }
    const name = identityError(error);
    return NextResponse.json(
      { error: name === "CodeMismatchException" ? "That code is not correct." : "That code is not valid or has expired." },
      { status: 400 },
    );
  }
}
