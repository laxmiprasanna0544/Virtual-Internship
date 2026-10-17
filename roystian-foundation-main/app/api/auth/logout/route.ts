import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/server/identity";
import { SESSION_COOKIE, clearSessionCookies } from "@/lib/server/session";

/** Signs out: revokes this session on the server and clears the cookie. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token).catch((error) => console.error("sign-out failed:", error));
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response.cookies);
  return response;
}
