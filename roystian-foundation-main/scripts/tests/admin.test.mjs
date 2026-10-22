/**
 * Staff console: role enforcement on every /api/admin route, trainer domain
 * and college cohort scoping (row level security), progress overrides,
 * certificate issue/revoke, suspension (account disabled, sessions revoked), leads, and the audit
 * log.
 */
import {
  check,
  Client,
  curriculum,
  enrol,
  finish,
  newStaff,
  newStudent,
  PASSWORD,
  section,
  sql,
  uniqueEmail,
} from "./lib.mjs";

const { getDomain, moduleAssessments, finalAssessment, correctAnswers } = curriculum();
const UUID = "00000000-0000-4000-8000-000000000000";

const ADMIN_POSTS = {
  "certificates/issue": { studentId: UUID },
  "certificates/status": { certificateId: "RF-NONE", status: "revoked" },
  "challenges/score": { entryId: UUID, score: 50, feedback: "" },
  "fellowship/stage": { applicationId: UUID, stage: "shortlisted" },
  "leads/status": { id: UUID, status: "contacted" },
  "payments/refund": { paymentId: UUID },
  "projects/evaluate": { submissionId: UUID, criterionScores: {}, feedback: "" },
  "scholarships/decide": { applicationId: UUID, status: "declined" },
  "students/progress": { action: "final", studentId: UUID, passed: true },
  "students/status": { studentId: UUID, status: "active" },
  "submissions/review": { submissionId: UUID, status: "approved", feedback: "" },
  files: { kind: "submission", id: UUID },
};

section("Role enforcement on every admin route");
const anon = new Client("admin-anon");
const student = new Client("admin-student");
await newStudent(student);
const noMfa = new Client("admin-no-mfa");
await newStaff(noMfa, "admin", { mfa: false });

let res = await anon.get("/api/admin/data");
check("GET data: signed out → 401", res.status === 401, res.status);
res = await student.get("/api/admin/data");
check("GET data: student → 403", res.status === 403, res.status);
res = await noMfa.get("/api/admin/data");
check("GET data: admin without MFA → 403 mfa_required", res.status === 403 && res.json?.code === "mfa_required", res.text);
for (const [route, body] of Object.entries(ADMIN_POSTS)) {
  const a = await anon.post(`/api/admin/${route}`, body);
  const s = await student.post(`/api/admin/${route}`, body);
  const m = await noMfa.post(`/api/admin/${route}`, body);
  check(
    `POST ${route}: signed out 401, student 403, no-MFA staff 403 mfa_required`,
    a.status === 401 && s.status === 403 && m.status === 403 && m.json?.code === "mfa_required",
    `${a.status}/${s.status}/${m.status}`,
  );
}

const trainerOnlyForbidden = ["certificates/issue", "certificates/status", "challenges/score", "fellowship/stage", "leads/status", "payments/refund", "scholarships/decide", "students/progress", "students/status"];
const trainer = new Client("admin-trainer");
const trainerAccount = await newStaff(trainer, "trainer", { trainerDomains: ["ai-ml"] });
for (const route of trainerOnlyForbidden) {
  res = await trainer.post(`/api/admin/${route}`, ADMIN_POSTS[route]);
  check(`POST ${route}: trainer → 403 (admin only)`, res.status === 403, res.status);
}

const admin = new Client("admin");
const adminAccount = await newStaff(admin, "admin");

section("Trainer sees only their domains");
const inDomain = new Client("admin-in-domain");
const inAccount = await newStudent(inDomain, { name: "In Domain Student", college: "Vignan Institute of Technology" });
await enrol(inDomain, "ai-ml", "self-paced");
const outDomain = new Client("admin-out-domain");
const outAccount = await newStudent(outDomain, { name: "Out Domain Student", college: "BMS College of Engineering" });
await enrol(outDomain, "data-analytics", "self-paced");

res = await trainer.get("/api/admin/data");
const trainerStudents = res.json?.data?.students ?? [];
check("trainer loads the console data", res.status === 200, res.status);
check("trainer sees the student in their domain", trainerStudents.some((s) => s.id === inAccount.id), trainerStudents.length);
check("trainer does not see the student outside their domains", !trainerStudents.some((s) => s.id === outAccount.id));
check("every student the trainer sees is in their domains", trainerStudents.every((s) => s.domainId === "ai-ml"), [...new Set(trainerStudents.map((s) => s.domainId))]);
check("trainer sees no payments of out-of-domain students", !(res.json?.data?.payments ?? []).some((p) => p.studentId === outAccount.id));
check("trainer cannot read college leads", (res.json?.data?.leads ?? []).length === 0, (res.json?.data?.leads ?? []).length);

const [outSubmission] = await sql`
  insert into public.submissions (student_id, domain_id, task_title, response_text, file_path, file_name, status, submitted_at)
  values (${outAccount.id}, 'data-analytics', 'Task', 'Answer', ${`submissions/${outAccount.id}/data-analytics/x-report.pdf`}, 'report.pdf', 'submitted', now())
  returning id`;
const [inSubmission] = await sql`
  insert into public.submissions (student_id, domain_id, task_title, response_text, file_path, file_name, status, submitted_at)
  values (${inAccount.id}, 'ai-ml', 'Task', 'Answer', ${`submissions/${inAccount.id}/ai-ml/x-report.pdf`}, 'report.pdf', 'submitted', now())
  returning id`;
res = await trainer.post("/api/admin/submissions/review", { submissionId: outSubmission.id, status: "approved", feedback: "" });
check("trainer cannot review a submission outside their domains (403)", res.status === 403, res.status);
res = await trainer.post("/api/admin/files", { kind: "submission", id: outSubmission.id });
check("trainer cannot download a file outside their domains", res.status === 404 || res.status === 403, res.status);
res = await trainer.post("/api/admin/files", { kind: "submission", id: inSubmission.id });
check("trainer can download a file in their domain", res.status === 200 && /^http/.test(res.json?.url ?? ""), res.text);
res = await trainer.post("/api/admin/submissions/review", { submissionId: inSubmission.id, status: "needs-revision", feedback: "Add metrics." });
check("trainer reviews a submission in their domain", res.status === 200, res.text);

const outProject = curriculum().projects.projectsForDomain("data-analytics")[0];
const [outProjectRow] = await sql`
  insert into public.project_submissions (student_id, project_id, domain_id, status, analysis, submitted_at)
  values (${outAccount.id}, ${outProject.id}, 'data-analytics', 'submitted', 'Analysis', now())
  returning id`;
const scores = Object.fromEntries(outProject.evaluationCriteria.map((c) => [c.label, 80]));
res = await trainer.post("/api/admin/projects/evaluate", { submissionId: outProjectRow.id, criterionScores: scores, feedback: "" });
check("trainer cannot evaluate a project outside their domains (403)", res.status === 403, res.status);
res = await admin.post("/api/admin/projects/evaluate", { submissionId: outProjectRow.id, criterionScores: scores, feedback: "Good" });
check("admin evaluates any project; score weighted on the server", res.status === 200 && res.json?.overallScore === 80, res.text);

section("College sees only its own cohort");
const college = new Client("admin-college");
await newStaff(college, "college", { collegeId: "college_vjit" });
res = await college.get("/api/admin/data");
const cohort = res.json?.data?.students ?? [];
check("college loads its dashboard data", res.status === 200, res.status);
check("college sees its own student", cohort.some((s) => s.id === inAccount.id));
check("college does not see another college's student", !cohort.some((s) => s.id === outAccount.id));
check("every student the college sees names that college", cohort.every((s) => s.college.trim().toLowerCase() === "vignan institute of technology"), [...new Set(cohort.map((s) => s.college))]);
res = await college.post("/api/admin/files", { kind: "submission", id: outSubmission.id });
check("college cannot download another college's file", res.status === 404 || res.status === 403, res.status);
res = await college.post("/api/admin/submissions/review", { submissionId: inSubmission.id, status: "approved", feedback: "" });
check("college cannot review submissions (403)", res.status === 403, res.status);

section("Admin sees everything");
res = await admin.get("/api/admin/data");
const all = res.json?.data?.students ?? [];
check("admin sees students from every domain and college", all.some((s) => s.id === inAccount.id) && all.some((s) => s.id === outAccount.id), all.length);

section("Progress overrides never replace earned results");
const DOMAIN = "ai-ml";
const assessments = moduleAssessments(DOMAIN);
res = await inDomain.post("/api/assessments/submit", { assessmentId: assessments[0].id, answers: correctAnswers(assessments[0]) });
check("student earns the first module assessment", res.json?.attempt?.passed === true, res.text);

const firstModule = getDomain(DOMAIN).modules[0].id;
res = await admin.post("/api/admin/students/progress", { action: "module", studentId: inAccount.id, moduleId: firstModule, complete: true });
check("admin marks a module complete", res.status === 200, res.text);
res = await admin.post("/api/admin/students/progress", { action: "module", studentId: inAccount.id, moduleId: "not-a-module", complete: true });
check("module from another domain is refused (400)", res.status === 400, res.status);

res = await admin.post("/api/admin/students/progress", { action: "all-modules", studentId: inAccount.id, complete: true });
check("admin completes all modules", res.status === 200, res.text);
const overrides = await sql`select assessment_id, overridden_by from public.assessment_attempts where student_id = ${inAccount.id} and overridden_by is not null and kind = 'module'`;
check("missing module results recorded as overrides by this admin", overrides.length === assessments.length - 1 && overrides.every((o) => o.overridden_by === adminAccount.id), overrides.length);
check("no override added for the assessment the student earned", !overrides.some((o) => o.assessment_id === assessments[0].id));

res = await admin.post("/api/admin/students/progress", { action: "all-modules", studentId: inAccount.id, complete: false });
check("admin clears all modules", res.status === 200, res.text);
const left = await sql`select overridden_by from public.assessment_attempts where student_id = ${inAccount.id} and kind = 'module'`;
check("overrides removed, earned attempt kept", left.length >= 1 && left.every((a) => a.overridden_by === null), left);

const final = finalAssessment(DOMAIN);
res = await admin.post("/api/admin/students/progress", { action: "final", studentId: inAccount.id, passed: true });
check("admin records the final as passed (override)", res.status === 200, res.text);
const [finalOverride] = await sql`select * from public.assessment_attempts where student_id = ${inAccount.id} and assessment_id = ${final.id}`;
check("final override marked with overridden_by", finalOverride?.overridden_by === adminAccount.id, finalOverride);
res = await inDomain.post("/api/assessments/submit", { assessmentId: final.id, answers: correctAnswers(final) });
check("the student's own final stays locked while module assessments are unpassed (403)", res.status === 403, res.text);
for (const assessment of assessments.slice(1)) {
  await inDomain.post("/api/assessments/submit", { assessmentId: assessment.id, answers: correctAnswers(assessment) });
}
res = await inDomain.post("/api/assessments/submit", { assessmentId: final.id, answers: correctAnswers(final) });
check("student also passes the final themselves", res.json?.attempt?.passed === true, res.text);
res = await admin.post("/api/admin/students/progress", { action: "final", studentId: inAccount.id, passed: false });
check("removing the override keeps the earned final (notice)", res.status === 200 && /stays/.test(res.json?.notice ?? ""), res.text);
const finals = await sql`select overridden_by from public.assessment_attempts where student_id = ${inAccount.id} and assessment_id = ${final.id}`;
check("only the earned final attempt remains", finals.length === 1 && finals[0].overridden_by === null, finals);

section("Certificates: issue enforces the rules, revoke/restore");
res = await admin.post("/api/admin/certificates/issue", { studentId: inAccount.id });
check("admin cannot issue before every requirement is met (403)", res.status === 403, res.text);
await admin.post("/api/admin/students/progress", { action: "all-modules", studentId: inAccount.id, complete: true });
await sql`update public.submissions set status = 'approved' where id = ${inSubmission.id}`;
res = await admin.post("/api/admin/certificates/issue", { studentId: inAccount.id });
check("admin issues once requirements are met", res.status === 200 && res.json?.certificate?.id, res.text);
const certId = res.json?.certificate?.id;

res = await admin.post("/api/admin/certificates/status", { certificateId: certId, status: "revoked", reason: "Academic misconduct" });
check("admin revokes the certificate", res.status === 200, res.text);
res = await anon.get(`/api/certificates/verify/${certId}`);
check("public verification shows revoked", res.json?.certificate?.status === "revoked", res.text);
res = await admin.post("/api/admin/certificates/status", { certificateId: certId, status: "valid" });
check("admin restores the certificate", res.status === 200, res.text);
res = await anon.get(`/api/certificates/verify/${certId}`);
check("public verification shows valid again", res.json?.certificate?.status === "valid", res.text);
res = await admin.post("/api/admin/certificates/status", { certificateId: "RF-NOPE-2026-000000", status: "revoked" });
check("unknown certificate → 404", res.status === 404, res.status);

section("Suspension disables the account and revokes sessions");
const victim = new Client("admin-victim");
const victimAccount = await newStudent(victim);
res = await admin.post("/api/admin/students/status", { studentId: victimAccount.id, status: "suspended" });
check("admin suspends the student", res.status === 200, res.text);
res = await new Client("victim-relogin").post("/api/auth/login", { email: victimAccount.email, password: PASSWORD });
check("suspended student cannot sign in (403 suspended)", res.status === 403 && /suspended/i.test(res.json?.error ?? ""), res.text);
res = await victim.post("/api/student/notes", { domainId: "ai-ml", moduleId: "ai-ml-m01", note: "still here?" });
check("existing session revoked: student APIs refuse it (401)", res.status === 401, res.text);
res = await victim.post("/api/payment/create-order", { domainId: "ai-ml", programId: "self-paced", experience: "beginner" });
check("suspended student cannot start a checkout (401, session revoked)", res.status === 401, res.status);
res = await victim.get("/dashboard");
check("existing session redirected away from the dashboard", res.status === 307 && /login/.test(res.headers.get("location") ?? ""), res.headers.get("location"));
res = await admin.post("/api/admin/students/status", { studentId: victimAccount.id, status: "active" });
check("admin reactivates the student", res.status === 200, res.text);
const again = new Client("victim-back");
res = await again.post("/api/auth/login", { email: victimAccount.email, password: PASSWORD });
check("reactivated student can sign in again", res.status === 200, res.text);
res = await admin.post("/api/admin/students/status", { studentId: UUID, status: "suspended" });
check("unknown student → 404", res.status === 404, res.status);

section("College leads");
const leadEmail = uniqueEmail("lead");
const visitor = new Client("lead-visitor");
res = await visitor.post("/api/leads", { collegeName: "Test College", contactPerson: "Dr Test", email: leadEmail, message: "We'd like a call." });
check("public enquiry accepted", res.status === 200, res.text);
const [lead] = await sql`select * from public.college_leads where email = ${leadEmail}`;
check("lead stored as new", lead?.status === "new", lead?.status);
res = await visitor.post("/api/leads", { collegeName: "Spam", contactPerson: "Bot", email: uniqueEmail("spam"), website: "http://spam.example" });
check("honeypot field rejects bots (400)", res.status === 400, res.status);
res = await admin.post("/api/admin/leads/status", { id: lead.id, status: "contacted" });
check("admin updates the lead status", res.status === 200, res.text);
const [leadAfter] = await sql`select status from public.college_leads where id = ${lead.id}`;
check("lead status saved", leadAfter?.status === "contacted", leadAfter);
res = await admin.post("/api/admin/leads/status", { id: lead.id, status: "archived" });
check("invalid lead status → 400", res.status === 400, res.status);
res = await admin.get("/api/admin/data");
check("admin sees leads", (res.json?.data?.leads ?? []).some((l) => l.id === lead.id));

section("Audit log");
const auditRows = await sql`select action, target_id, actor_id from public.admin_audit_log where actor_id = ${adminAccount.id}`;
const actions = new Set(auditRows.map((r) => r.action));
for (const action of [
  "progress.module",
  "progress.all-modules",
  "progress.final",
  "certificate.issue",
  "certificate.revoke",
  "certificate.restore",
  "student.suspend",
  "student.reactivate",
  "lead.status",
  "project.evaluate",
]) {
  check(`audit log records ${action} with the actor`, actions.has(action), [...actions]);
}
const trainerAudit = await sql`select action from public.admin_audit_log where actor_id = ${trainerAccount.id}`;
check("trainer actions are audited too (review, file download)", trainerAudit.some((r) => r.action === "submission.review") && trainerAudit.some((r) => r.action === "file.download"), trainerAudit.map((r) => r.action));

await finish("admin");
