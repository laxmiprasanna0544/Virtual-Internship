import { NextRequest, NextResponse } from "next/server";
import { withAnon } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

interface VerifyRow {
  id: string;
  student_name: string;
  domain_id: string;
  domain_name: string;
  program_id: string;
  program_name: string;
  duration: string;
  issue_date: string;
  status: "valid" | "revoked";
}

/**
 * Public certificate verification. No sign-in; returns only the fields
 * printed on the certificate, through the verify_certificate() function.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`certificate-verify:${clientIp(req)}`, 60, 60);
  if (limited) return limited;

  const { id } = await params;
  if (!/^[A-Za-z0-9-]{3,64}$/.test(id)) {
    return NextResponse.json({ certificate: null }, { status: 404 });
  }
  const [row] = await withAnon((tx) => tx<VerifyRow[]>`select * from public.verify_certificate(${id})`);
  if (!row) return NextResponse.json({ certificate: null }, { status: 404 });
  return NextResponse.json(
    {
      certificate: {
        id: row.id,
        studentName: row.student_name,
        domainId: row.domain_id,
        domainName: row.domain_name,
        programId: row.program_id,
        programName: row.program_name,
        duration: row.duration,
        issueDate: row.issue_date,
        status: row.status,
      },
    },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
