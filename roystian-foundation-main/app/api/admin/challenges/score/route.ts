import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChallenge } from "@/data/challenges";
import { notify } from "@/lib/server/notify";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.object({
  entryId: z.string().uuid(),
  score: z.number().min(0).max(100),
  feedback: z.string().trim().max(4000),
});

/** Scores an industry challenge entry. Feeds problem-solving readiness. */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid score.");
  const { entryId, feedback } = parsed.data;
  const score = Math.round(parsed.data.score);

  const { data: entry } = await ctx.admin
    .from("challenge_entries")
    .select("id, student_id, challenge_id, status")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry) return badRequest("Entry not found.", 404);
  if (entry.status === "draft") return badRequest("This entry has not been submitted.", 409);

  const { error } = await ctx.admin
    .from("challenge_entries")
    .update({ status: "evaluated", score, feedback: feedback || null, evaluated_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) return badRequest("Could not save the score.", 500);

  await Promise.all([
    notify(
      ctx.admin,
      entry.student_id,
      "assessment",
      "Challenge entry evaluated",
      `${getChallenge(entry.challenge_id)?.title ?? "Your challenge"} scored ${score}/100.`,
      "/dashboard/challenges",
    ),
    audit(ctx, "challenge.score", "challenge_entry", entryId, { score }),
  ]);
  return NextResponse.json({ ok: true });
}
