import { NextRequest, NextResponse } from "next/server";
import { getDomain } from "@/data/domains";
import { validateSubmission } from "@/lib/submission-validation";

export async function POST(req: NextRequest) {
  const { domainId, responseText, fileName, fileSize } = await req.json();

  const domain = getDomain(domainId);
  if (!domain) {
    return NextResponse.json(
      { valid: false, reason: "Unknown domain." },
      { status: 400 },
    );
  }

  const result = validateSubmission(
    { responseText: responseText ?? "", fileName: fileName ?? null, fileSize },
    domain.practicalTask,
  );

  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
