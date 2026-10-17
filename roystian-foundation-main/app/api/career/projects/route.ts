import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/data/projects";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { dbMessage } from "@/lib/server/enrolment";
import { keyBelongsTo, verifyUpload } from "@/lib/server/storage";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), projectId: z.string().min(1).max(200) }),
  z.object({
    action: z.literal("draft"),
    submissionId: z.string().uuid(),
    analysis: z.string().max(20000).optional(),
    recommendations: z.string().max(20000).optional(),
    repoUrl: z.string().trim().url().max(500).nullable().optional(),
    reportKey: z.string().max(600).nullable().optional(),
    reportFileName: z.string().max(255).nullable().optional(),
  }),
  z.object({ action: z.literal("submit"), submissionId: z.string().uuid() }),
]);

/**
 * Project briefs: start, save a draft, submit. Runs under RLS, and the review
 * guard keeps an evaluated project from being changed.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = parsed.data;

  try {
    if (input.action === "start") {
      const brief = getProject(input.projectId);
      if (!brief) return NextResponse.json({ error: "Unknown project." }, { status: 404 });
      await withUser(userId, (tx) => tx`
        insert into public.project_submissions (student_id, project_id, domain_id, status, started_at)
        values (${userId}, ${brief.id}, ${brief.domainId}, 'in-progress', now())
        on conflict (student_id, project_id) do nothing`);
      return NextResponse.json({ ok: true });
    }

    if (input.action === "draft") {
      if (input.reportKey) {
        if (!keyBelongsTo(input.reportKey, userId) || !input.reportKey.startsWith(`projects/${userId}/`)) {
          return NextResponse.json({ error: "Invalid file reference." }, { status: 400 });
        }
        const stored = await verifyUpload(input.reportKey);
        if (!stored.ok) return NextResponse.json({ error: stored.reason }, { status: 422 });
      }
      const rows = await withUser(userId, (tx) => tx`
        update public.project_submissions
        set analysis = coalesce(${input.analysis ?? null}, analysis),
            recommendations = coalesce(${input.recommendations ?? null}, recommendations),
            repo_url = ${input.repoUrl === undefined ? tx`repo_url` : input.repoUrl},
            report_file_path = coalesce(${input.reportKey ?? null}, report_file_path),
            report_file_name = coalesce(${input.reportKey ? (input.reportFileName ?? null) : null}, report_file_name)
        where id = ${input.submissionId} and student_id = ${userId}
        returning id`);
      if (!rows.length) return NextResponse.json({ error: "Project not found." }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    const rows = await withUser(userId, (tx) => tx`
      update public.project_submissions
      set status = 'submitted', submitted_at = now()
      where id = ${input.submissionId} and student_id = ${userId}
      returning id`);
    if (!rows.length) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = dbMessage(error);
    if (message.includes("evaluated project")) {
      return NextResponse.json({ error: "This project has already been evaluated." }, { status: 409 });
    }
    console.error("project write failed:", message);
    return NextResponse.json({ error: "Could not save the project." }, { status: 500 });
  }
}
