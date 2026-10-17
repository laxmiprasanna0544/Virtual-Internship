import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChallenge } from "@/data/challenges";
import { readJson, requireStudent } from "@/lib/server/auth";
import { withUser } from "@/lib/server/db";
import { dbMessage } from "@/lib/server/enrolment";

const body = z.object({
  challengeId: z.string().min(1).max(200),
  approach: z.string().max(20000),
  solution: z.string().max(40000),
  repoUrl: z.string().trim().url().max(500).nullable(),
});

/** Submits (or resubmits) a challenge entry. Evaluated entries are final. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  const { challengeId, approach, solution, repoUrl } = parsed.data;
  if (!getChallenge(challengeId)) return NextResponse.json({ error: "Unknown challenge." }, { status: 404 });

  try {
    await withUser(userId, (tx) => tx`
      insert into public.challenge_entries
        (student_id, challenge_id, status, approach, solution, repo_url, submitted_at)
      values (${userId}, ${challengeId}, 'submitted', ${approach}, ${solution}, ${repoUrl}, now())
      on conflict (student_id, challenge_id) do update
      set status = 'submitted', approach = excluded.approach, solution = excluded.solution,
          repo_url = excluded.repo_url, submitted_at = now()`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = dbMessage(error);
    if (message.includes("evaluate")) {
      return NextResponse.json({ error: "This entry has already been evaluated." }, { status: 409 });
    }
    console.error("challenge write failed:", message);
    return NextResponse.json({ error: "Could not submit your entry." }, { status: 500 });
  }
}
