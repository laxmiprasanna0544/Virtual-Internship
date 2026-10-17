import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/data/projects";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { hasPaidForDomain } from "@/lib/server/enrolment";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { isAllowedContentType, MAX_UPLOAD_BYTES, presignUpload, uploadKey, uploadsEnabled } from "@/lib/server/storage";
import { ALLOWED_SUBMISSION_EXTENSIONS } from "@/lib/submission-validation";

const body = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("submission"),
    domainId: z.string().min(1).max(100),
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(200),
    size: z.number().int().positive(),
  }),
  z.object({
    purpose: z.literal("project-report"),
    projectId: z.string().min(1).max(200),
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(200),
    size: z.number().int().positive(),
  }),
]);

/**
 * Issues a presigned S3 POST for one file under the student's own prefix.
 * The upload is re-checked on the server before it is recorded.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  if (!uploadsEnabled()) {
    return NextResponse.json(
      { error: "File attachments aren't available yet. Submit your work as text instead.", code: "uploads_disabled" },
      { status: 503 },
    );
  }
  const limited = rateLimit(`upload:${auth.user.id}`, 20, 600) ?? rateLimit(`upload-ip:${clientIp(req)}`, 300, 600);
  if (limited) return limited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  const input = parsed.data;

  if (input.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That file is larger than the 20MB limit." }, { status: 413 });
  }
  const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_SUBMISSION_EXTENSIONS.includes(ext) || !isAllowedContentType(input.contentType)) {
    return NextResponse.json({ error: "That file type is not allowed." }, { status: 415 });
  }

  const domainId =
    input.purpose === "submission" ? input.domainId : (getProject(input.projectId)?.domainId ?? null);
  if (!domainId) return NextResponse.json({ error: "Unknown project." }, { status: 404 });
  const paid = await withUser(auth.user.id, (tx) => hasPaidForDomain(tx, domainId));
  if (!paid) return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });

  const key =
    input.purpose === "submission"
      ? uploadKey("submissions", auth.user.id, domainId, input.fileName)
      : uploadKey("projects", auth.user.id, input.projectId, input.fileName);
  const { url, fields } = await presignUpload(key, input.contentType);
  return NextResponse.json({ url, fields, key }, { headers: { "Cache-Control": "no-store" } });
}
