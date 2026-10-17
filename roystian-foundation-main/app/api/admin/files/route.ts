import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";
import { presignDownload } from "@/lib/server/storage";

const body = z.object({
  kind: z.enum(["submission", "project"]),
  id: z.string().uuid(),
});

/**
 * A five-minute download link for a student's uploaded file. The record is
 * read as the caller, so row level security decides whether this staff
 * member may see it (admins, trainers for the domain, the student's college).
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin", "trainer", "college"]);
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request.");
  const { kind, id } = parsed.data;

  const file = await withUser(auth.ctx.userId, async (tx) => {
    const rows =
      kind === "submission"
        ? await tx<{ key: string | null; name: string | null }[]>`
            select file_path as key, file_name as name from public.submissions where id = ${id}`
        : await tx<{ key: string | null; name: string | null }[]>`
            select report_file_path as key, report_file_name as name
            from public.project_submissions where id = ${id}`;
    return rows[0] ?? null;
  });
  if (!file) return badRequest("Not found.", 404);
  if (!file.key) return badRequest("No file was uploaded with this submission.", 404);

  const url = await presignDownload(file.key, file.name);
  await audit(auth.ctx, "file.download", kind, id);
  return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
