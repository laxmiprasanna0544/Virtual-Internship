import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { readJson, requireStudent } from "@/lib/server/auth";
import { validateSubmission } from "@/lib/submission-validation";

const body = z.object({
  domainId: z.string().min(1).max(100),
  responseText: z.string().max(20000).default(""),
  fileName: z.string().max(255).nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
});

/**
 * Early feedback on a practical task before the upload starts. The submission
 * route repeats the same check authoritatively.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "Invalid submission." }, { status: 400 });
  }
  const { domainId, responseText, fileName, fileSize } = parsed.data;

  const domain = getDomain(domainId);
  if (!domain) {
    return NextResponse.json({ valid: false, reason: "Unknown domain." }, { status: 400 });
  }

  const result = validateSubmission(
    { responseText, fileName: fileName ?? null, fileSize: fileSize ?? undefined },
    domain.practicalTask,
  );
  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
