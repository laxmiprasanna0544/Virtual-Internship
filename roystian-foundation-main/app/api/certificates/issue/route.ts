import { NextResponse } from "next/server";
import { issueCertificateFor } from "@/lib/server/certificates";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/supabase/server";

/** The signed-in student asks for their certificate; the server decides. */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const result = await issueCertificateFor(getSupabaseAdminClient(), user.id);
  return result.ok
    ? NextResponse.json({ certificate: result.certificate })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
