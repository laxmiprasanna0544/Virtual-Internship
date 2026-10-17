import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getDomain } from "@/data/domains";
import { getLearningGuide } from "@/data/guides";
import { requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { hasPaidForDomain } from "@/lib/server/enrolment";
import { rateLimit } from "@/lib/server/rate-limit";

/**
 * The domain's learning guide (PDF), for students enrolled in that domain.
 * The files are paid course material, so they are not in public/.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ domainId: string }> }) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const { domainId } = await params;
  const guide = getLearningGuide(domainId);
  const domain = getDomain(domainId);
  if (!guide || !domain) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

  const limited = rateLimit(`guide:${auth.user.id}`, 30, 600);
  if (limited) return limited;

  const enrolled = await withUser(auth.user.id, (tx) => hasPaidForDomain(tx, domainId));
  if (!enrolled) {
    return NextResponse.json({ error: "Enrol in this domain to download its learning guide." }, { status: 403 });
  }

  // domainId is checked against the catalogue above, so it can't escape the folder.
  const file = await readFile(join(process.cwd(), "content", "guides", `${guide.domainId}.pdf`));
  const filename = `Roystian-${domain.shortName.replace(/[^A-Za-z0-9]+/g, "-")}-Learning-Guide.pdf`;
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
