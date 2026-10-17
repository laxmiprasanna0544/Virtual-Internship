import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";

const body = z.object({
  headline: z.string().max(300),
  summary: z.string().max(4000),
  skills: z.array(z.string().max(100)).max(60),
  includeProjects: z.boolean(),
  includeAssessments: z.boolean(),
  includeCertificate: z.boolean(),
});

/** Saves the student's resume draft. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid resume." }, { status: 400 });
  const d = parsed.data;
  await withUser(auth.user.id, (tx) => tx`
    insert into public.resume_drafts
      (student_id, headline, summary, skills, include_projects, include_assessments, include_certificate, updated_at)
    values (${auth.user.id}, ${d.headline}, ${d.summary}, ${d.skills}, ${d.includeProjects},
            ${d.includeAssessments}, ${d.includeCertificate}, now())
    on conflict (student_id) do update
    set headline = excluded.headline, summary = excluded.summary, skills = excluded.skills,
        include_projects = excluded.include_projects, include_assessments = excluded.include_assessments,
        include_certificate = excluded.include_certificate, updated_at = now()`);
  return NextResponse.json({ ok: true });
}
