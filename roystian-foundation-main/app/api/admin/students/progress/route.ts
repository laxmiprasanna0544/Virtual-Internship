import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain, getDomainAssessments, getFinalAssessment } from "@/data/domains";
import { readJson } from "@/lib/server/auth";
import { service } from "@/lib/server/db";
import { audit, badRequest, requireStaff } from "@/lib/server/staff";

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("module"),
    studentId: z.string().uuid(),
    moduleId: z.string().min(1),
    complete: z.boolean(),
  }),
  z.object({
    action: z.literal("all-modules"),
    studentId: z.string().uuid(),
    complete: z.boolean(),
  }),
  z.object({
    action: z.literal("final"),
    studentId: z.string().uuid(),
    passed: z.boolean(),
  }),
]);

type Outcome = { response: NextResponse; auditAction?: string; details?: Record<string, string | boolean> };

/**
 * Admin corrections to a student's progress in their active domain.
 *
 * Assessment results entered here are stored as override attempts
 * (overridden_by = the admin), never as the student's own work, and removing
 * them only removes overrides — a result the student earned is never deleted.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaff(["admin"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request.");
  const input = parsed.data;

  const outcome = await service(async (tx): Promise<Outcome> => {
    const [student] = await tx<{ id: string; domain_id: string | null }[]>`
      select id, domain_id from public.students where id = ${input.studentId} for update`;
    const domain = getDomain(student?.domain_id);
    if (!student || !domain) return { response: badRequest("The student has no active domain.", 404) };

    const [row] = await tx<{ completed_modules: string[] }[]>`
      select completed_modules from public.module_progress
      where student_id = ${student.id} and domain_id = ${domain.id}`;
    const completed = new Set(row?.completed_modules ?? []);

    const saveModules = (modules: string[]) => tx`
      insert into public.module_progress (student_id, domain_id, completed_modules)
      values (${student.id}, ${domain.id}, ${modules})
      on conflict (student_id, domain_id) do update set completed_modules = excluded.completed_modules`;

    const insertOverride = (assessmentId: string, kind: "module" | "final", total: number) => tx`
      insert into public.assessment_attempts
        (student_id, domain_id, assessment_id, kind, score, total, percentage, passed, overridden_by)
      values (${student.id}, ${domain.id}, ${assessmentId}, ${kind}, ${total}, ${total}, 100, true, ${ctx.userId})`;

    const removeOverrides = (kind: "module" | "final") => tx`
      delete from public.assessment_attempts
      where student_id = ${student.id} and domain_id = ${domain.id}
        and kind = ${kind} and overridden_by is not null`;

    if (input.action === "module") {
      if (!domain.modules.some((m) => m.id === input.moduleId)) {
        return { response: badRequest("That module is not part of the student's domain.") };
      }
      if (input.complete) completed.add(input.moduleId);
      else completed.delete(input.moduleId);
      await saveModules(domain.modules.map((m) => m.id).filter((id) => completed.has(id)));
      return {
        response: NextResponse.json({ ok: true }),
        auditAction: "progress.module",
        details: { moduleId: input.moduleId, complete: input.complete },
      };
    }

    if (input.action === "all-modules") {
      if (input.complete) {
        await saveModules(domain.modules.map((m) => m.id));
        const passedRows = await tx<{ assessment_id: string }[]>`
          select assessment_id from public.assessment_attempts
          where student_id = ${student.id} and domain_id = ${domain.id} and passed`;
        const alreadyPassed = new Set(passedRows.map((r) => r.assessment_id));
        for (const assessment of getDomainAssessments(domain.id)) {
          if (!alreadyPassed.has(assessment.id)) {
            await insertOverride(assessment.id, "module", assessment.questionCount);
          }
        }
      } else {
        await saveModules([]);
        await removeOverrides("module");
      }
      return {
        response: NextResponse.json({ ok: true }),
        auditAction: "progress.all-modules",
        details: { complete: input.complete },
      };
    }

    // Final assessment.
    const final = getFinalAssessment(domain.id);
    if (!final) return { response: badRequest("This domain has no final assessment.") };
    if (input.passed) {
      await insertOverride(final.id, "final", final.questionCount);
      return { response: NextResponse.json({ ok: true }), auditAction: "progress.final", details: { passed: true } };
    }
    await removeOverrides("final");
    const earned = await tx`
      select id from public.assessment_attempts
      where student_id = ${student.id} and assessment_id = ${final.id} and passed
      limit 1`;
    if (earned.length) {
      return {
        response: NextResponse.json({
          ok: true,
          notice:
            "Admin overrides were removed. The student passed the final assessment themselves, so that result stays.",
        }),
        auditAction: "progress.final",
        details: { passed: false, keptEarned: true },
      };
    }
    return { response: NextResponse.json({ ok: true }), auditAction: "progress.final", details: { passed: false } };
  }).catch((error: unknown) => {
    console.error("progress update failed:", error instanceof Error ? error.message : error);
    return { response: badRequest("Could not update progress.", 500) } as Outcome;
  });

  if (outcome.auditAction) {
    await audit(ctx, outcome.auditAction, "student", input.studentId, outcome.details ?? {});
  }
  return outcome.response;
}

