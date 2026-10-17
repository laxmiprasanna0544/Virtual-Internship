import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { dbMessage, hasPaidForDomain } from "@/lib/server/enrolment";
import { keyBelongsTo, verifyUpload } from "@/lib/server/storage";
import { validateSubmission } from "@/lib/submission-validation";

const body = z.object({
  domainId: z.string().min(1).max(100),
  responseText: z.string().max(20000),
  fileKey: z.string().max(600).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
});

/**
 * Submits the practical task. The text and any uploaded file are validated
 * here (authoritatively), and the write runs under RLS so the review guard
 * trigger still protects reviewed work.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const { domainId, responseText, fileKey, fileName } = parsed.data;
  const userId = auth.user.id;

  const domain = getDomain(domainId);
  if (!domain) return NextResponse.json({ error: "Unknown domain." }, { status: 400 });

  let fileSize: number | undefined;
  if (fileKey) {
    if (!fileName || !keyBelongsTo(fileKey, userId) || !fileKey.startsWith(`submissions/${userId}/${domainId}/`)) {
      return NextResponse.json({ error: "Invalid file reference." }, { status: 400 });
    }
    const stored = await verifyUpload(fileKey);
    if (!stored.ok) return NextResponse.json({ error: stored.reason }, { status: 422 });
    fileSize = stored.size;
  }

  const check = validateSubmission(
    { responseText, fileName: fileKey ? (fileName ?? null) : null, fileSize },
    domain.practicalTask,
  );
  if (!check.valid) return NextResponse.json({ error: check.reason }, { status: 422 });

  try {
    const result = await withUser(userId, async (tx) => {
      if (!(await hasPaidForDomain(tx, domainId))) return "not-enrolled" as const;
      const file = fileKey ? { path: fileKey, name: fileName ?? null } : null;
      await tx`
        insert into public.submissions
          (student_id, domain_id, task_title, response_text, file_path, file_name, status, submitted_at)
        values (${userId}, ${domainId}, ${domain.practicalTask.title}, ${responseText.trim()},
                ${file?.path ?? null}, ${file?.name ?? null}, 'submitted', now())
        on conflict (student_id, domain_id) do update
        set task_title = excluded.task_title,
            response_text = excluded.response_text,
            file_path = coalesce(excluded.file_path, public.submissions.file_path),
            file_name = coalesce(excluded.file_name, public.submissions.file_name),
            status = 'submitted',
            submitted_at = now()`;
      return "ok" as const;
    });
    if (result === "not-enrolled") {
      return NextResponse.json({ error: "You are not enrolled in this domain." }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = dbMessage(error);
    if (message.includes("reviewed submission")) {
      return NextResponse.json(
        { error: "This submission has already been reviewed and can no longer be changed." },
        { status: 409 },
      );
    }
    console.error("submission save failed:", message);
    return NextResponse.json({ error: "Unable to submit your work. Please try again." }, { status: 500 });
  }
}
