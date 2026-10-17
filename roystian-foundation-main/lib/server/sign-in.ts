import "server-only";

import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/server/accounts";
import { revokeSession } from "@/lib/server/identity";
import { MFA_COOKIE, setSessionCookie } from "@/lib/server/session";
import { staffMfaRequired } from "@/lib/server/staff";
import type { Student } from "@/types";

/**
 * Finishes a successful sign-in: checks the account in the database (exists,
 * not suspended), then sets the session cookie.
 */
export async function completeSignIn(token: string, userId: string) {
  const account = await loadAccount(userId);

  const refuse = async (message: string, status: number) => {
    await revokeSession(token);
    const response = NextResponse.json({ error: message }, { status });
    response.cookies.set(MFA_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!account) return refuse("Your account profile could not be loaded. Contact support.", 403);
  if (account.user.role === "student" && (account.user as Student).status === "suspended") {
    return refuse("This account is suspended. Contact the programme team.", 403);
  }

  const response = NextResponse.json({
    ok: true,
    user: account.user,
    mfaSetupRequired: account.user.role !== "student" && staffMfaRequired() && !account.mfaEnabled,
  });
  setSessionCookie(response.cookies, token);
  return response;
}
