import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/server/accounts";
import { startTotpEnrolment } from "@/lib/server/identity";
import { getAuthenticatedUser } from "@/lib/server/session";

/** Starts authenticator-app enrolment; returns the secret and otpauth URI. */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const account = await loadAccount(user.id);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const secret = await startTotpEnrolment(user.id);
  const label = encodeURIComponent(`Roystian Foundation:${account.user.email}`);
  const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("Roystian Foundation")}&algorithm=SHA1&digits=6&period=30`;
  return NextResponse.json({ secret, otpauth }, { headers: { "Cache-Control": "no-store" } });
}
