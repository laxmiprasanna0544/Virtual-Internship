import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/server/auth";
import { issueCertificateFor } from "@/lib/server/certificates";

/** The signed-in student asks for their certificate; the server decides. */
export async function POST() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const result = await issueCertificateFor(auth.user.id);
  return result.ok
    ? NextResponse.json({ certificate: result.certificate })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
