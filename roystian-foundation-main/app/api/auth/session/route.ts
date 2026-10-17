import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/server/accounts";
import { getAuthenticatedUser } from "@/lib/server/session";

/** The signed-in account, or null. Used by the client to render the session. */
export async function GET() {
  const user = await getAuthenticatedUser();
  const account = user ? await loadAccount(user.id) : null;
  return NextResponse.json(
    { user: account?.user ?? null, mfaEnabled: account?.mfaEnabled ?? false },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
