import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain, getDomainAssessments, getFinalAssessment } from "@/data/domains";
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

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid request.");
  const input = parsed.data;

  const { data: student } = await ctx.admin
    .from("students")
    .select("id, domain_id")
    .eq("id", input.studentId)
    .maybeSingle();
  const domain = getDomain(student?.domain_id);
  if (!student || !domain) return badRequest("The student has no active domain.", 404);

  const { data: row } = await ctx.admin
    .from("module_progress")
    .select("completed_modules")
    .eq("student_id", student.id)
    .eq("domain_id", domain.id)
    .maybeSingle();
  const completed = new Set(row?.completed_modules ?? []);

  const saveModules = (modules: string[]) =>
    ctx.admin.from("module_progress").upsert(
      { student_id: student.id, domain_id: domain.id, completed_modules: modules },
      { onConflict: "student_id,domain_id" },
    );

  const insertOverride = (assessmentId: string, kind: "module" | "final", total: number) =>
    ctx.admin.from("assessment_attempts").insert({
      student_id: student.id,
      domain_id: domain.id,
      assessment_id: assessmentId,
      kind,
      score: total,
      total,
      percentage: 100,
      passed: true,
      overridden_by: ctx.userId,
    });

  const removeOverrides = (kind: "module" | "final") =>
    ctx.admin
      .from("assessment_attempts")
      .delete()
      .eq("student_id", student.id)
      .eq("domain_id", domain.id)
      .eq("kind", kind)
      .not("overridden_by", "is", null);

  if (input.action === "module") {
    if (!domain.modules.some((m) => m.id === input.moduleId)) {
      return badRequest("That module is not part of the student's domain.");
    }
    if (input.complete) completed.add(input.moduleId);
    else completed.delete(input.moduleId);
    const { error } = await saveModules(domain.modules.map((m) => m.id).filter((id) => completed.has(id)));
    if (error) return badRequest("Could not update progress.", 500);
    await audit(ctx, "progress.module", "student", student.id, {
      moduleId: input.moduleId,
      complete: input.complete,
    });
    return NextResponse.json({ ok: true });
  }

  if (input.action === "all-modules") {
    if (input.complete) {
      const { error } = await saveModules(domain.modules.map((m) => m.id));
      if (error) return badRequest("Could not update progress.", 500);

      const { data: passedRows } = await ctx.admin
        .from("assessment_attempts")
        .select("assessment_id")
        .eq("student_id", student.id)
        .eq("domain_id", domain.id)
        .eq("passed", true);
      const alreadyPassed = new Set((passedRows ?? []).map((r) => r.assessment_id));
      for (const assessment of getDomainAssessments(domain.id)) {
        if (!alreadyPassed.has(assessment.id)) {
          await insertOverride(assessment.id, "module", assessment.questions.length);
        }
      }
    } else {
      const { error } = await saveModules([]);
      if (error) return badRequest("Could not update progress.", 500);
      await removeOverrides("module");
    }
    await audit(ctx, "progress.all-modules", "student", student.id, { complete: input.complete });
    return NextResponse.json({ ok: true });
  }

  // Final assessment.
  const final = getFinalAssessment(domain.id);
  if (!final) return badRequest("This domain has no final assessment.");
  if (input.passed) {
    const { error } = await insertOverride(final.id, "final", final.questions.length);
    if (error) return badRequest("Could not record the result.", 500);
  } else {
    await removeOverrides("final");
    const { data: earned } = await ctx.admin
      .from("assessment_attempts")
      .select("id")
      .eq("student_id", student.id)
      .eq("assessment_id", final.id)
      .eq("passed", true)
      .limit(1);
    if (earned?.length) {
      await audit(ctx, "progress.final", "student", student.id, { passed: false, keptEarned: true });
      return NextResponse.json({
        ok: true,
        notice: "Admin overrides were removed. The student passed the final assessment themselves, so that result stays.",
      });
    }
  }
  await audit(ctx, "progress.final", "student", student.id, { passed: input.passed });
  return NextResponse.json({ ok: true });
}
