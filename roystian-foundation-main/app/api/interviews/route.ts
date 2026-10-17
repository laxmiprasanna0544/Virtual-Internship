import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { questionsFor } from "@/data/interviews";
import { evaluateInterview } from "@/lib/interviews";
import { toInterviewSession, type InterviewRow } from "@/lib/records/career-mappers";
import { readJson, requireStudent } from "@/lib/server/auth";
import { getSql } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

const body = z.object({
  kind: z.enum(["technical", "hr", "project"]),
  answers: z.record(z.string().max(100), z.string().max(5000)),
});

/**
 * Scores a mock interview on the server and records it. Interview scores
 * feed the communication part of Career Readiness, so they are never taken
 * from the browser.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`interview:${auth.user.id}`, 20, 3600);
  if (limited) return limited;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  const { kind } = parsed.data;

  const sql = getSql();
  const [student] = await sql<{ domain_id: string | null }[]>`
    select domain_id from public.students where id = ${auth.user.id}`;
  const domain = getDomain(student?.domain_id);
  if (!student || !domain) {
    return NextResponse.json({ error: "Choose a domain before practising interviews." }, { status: 400 });
  }

  const questionIds = new Set(questionsFor(kind, domain.name).map((q) => q.id));
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([id]) => questionIds.has(id)),
  );
  const feedback = evaluateInterview(kind, domain.name, answers);

  try {
    const [row] = await sql<InterviewRow[]>`
      insert into public.interview_sessions
        (student_id, kind, domain_id, answers, scores, overall_score, strengths, improvements)
      values (${auth.user.id}, ${kind}, ${domain.id}, ${sql.json(answers)}, ${sql.json({ ...feedback.scores })},
              ${feedback.overallScore}, ${feedback.strengths}, ${feedback.improvements})
      returning *`;
    return NextResponse.json({ session: toInterviewSession(row), feedback });
  } catch (error) {
    console.error("interview insert failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not save the session." }, { status: 500 });
  }
}
