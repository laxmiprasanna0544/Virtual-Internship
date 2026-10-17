import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/server/db";
import { getAuthenticatedUser, type SessionUser } from "@/lib/server/session";
import type { Role } from "@/types";

type Guarded<T> = { ok: true; user: T } | { ok: false; response: NextResponse };

const unauthorised = () => NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

/** Any signed-in account. */
export async function requireUser(): Promise<Guarded<SessionUser>> {
  const user = await getAuthenticatedUser();
  return user ? { ok: true, user } : { ok: false, response: unauthorised() };
}

/**
 * A signed-in, non-suspended student. Suspension is checked against the
 * database on every call, so it takes effect immediately even while the
 * student's access token is still valid.
 */
export async function requireStudent(): Promise<Guarded<SessionUser>> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, response: unauthorised() };
  const [row] = await getSql()<{ role: Role; status: string | null }[]>`
    select p.role, s.status
    from public.profiles p
    left join public.students s on s.id = p.id
    where p.id = ${user.id}`;
  if (!row || row.role !== "student") {
    return { ok: false, response: NextResponse.json({ error: "Only student accounts can do this." }, { status: 403 }) };
  }
  if (row.status === "suspended") {
    return {
      ok: false,
      response: NextResponse.json({ error: "This account is suspended. Contact the programme team." }, { status: 403 }),
    };
  }
  return { ok: true, user };
}

/** Parses a JSON body, returning null (never throwing) on malformed input. */
export async function readJson(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => null);
}
