/**
 * The whole student journey through the real API routes:
 * sign-up → Cashfree checkout → signed webhook → enrolment → modules →
 * assessments (server-scored, answers withheld on failure, attempt cap) →
 * practical task upload to S3 → review → final assessment → certificate →
 * public verification → transactional email.
 */
import {
  check,
  Client,
  curriculum,
  enrol,
  finish,
  newStaff,
  newStudent,
  section,
  sentEmails,
  sql,
} from "./lib.mjs";

const { getDomain, moduleAssessments, finalAssessment, getProgram, correctAnswers, wrongAnswers } = curriculum();
const DOMAIN = "ai-ml";
const domain = getDomain(DOMAIN);

section("Sign-up and enrolment");
const student = new Client("journey-student");
const me = await newStudent(student, { name: "Journey Student" });
check("student signed up and signed in", Boolean(me.id));

let res = await student.get("/api/student/records");
check("records load before enrolment", res.status === 200 && res.json?.records?.student?.domainId === null, res.text);

res = await student.get(`/api/assessments/${domain.modules[0].id.replace(/-m01$/, "-m01")}-assessment`);
check("assessments are locked before payment (403)", res.status === 403, res.status);

const { orderId, registrationId } = await enrol(student, DOMAIN, "industry-led");
check("checkout → gateway → webhook produced a registration", /^RF-AIML-\d{4}-\d{6}$/.test(registrationId ?? ""), registrationId);

const [payment] = await sql`select * from public.payments where provider_order_id = ${orderId}`;
check("payment recorded as successful", payment?.status === "successful", payment?.status);
check("amount came from the catalogue, not the browser", payment?.amount_paise === getProgram("industry-led").price * 100, payment?.amount_paise);
check("gateway payment id stored", Boolean(payment?.provider_payment_id), payment?.provider_payment_id);

res = await student.get("/api/student/records");
const records = res.json?.records;
check("student is enrolled in the domain", records?.student?.domainId === DOMAIN && records?.student?.registrationId === registrationId, records?.student);

res = await student.get("/api/notifications");
check("registration notification delivered in-app", res.json?.notifications?.some((n) => /Registration confirmed/i.test(n.title)), res.text);

section("Modules and notes");
res = await student.post("/api/student/modules", { domainId: DOMAIN, moduleId: domain.modules[0].id, complete: true });
check("module marked complete", res.status === 200, res.text);
res = await student.post("/api/student/modules", { domainId: "python-development", moduleId: "python-development-m01", complete: true });
check("cannot complete a module in an unpaid domain (403)", res.status === 403, res.status);
res = await student.post("/api/student/notes", { domainId: DOMAIN, moduleId: domain.modules[0].id, note: "Gradient descent recap" });
check("module note saved", res.status === 200, res.text);
const [progress] = await sql`select * from public.module_progress where student_id = ${me.id} and domain_id = ${DOMAIN}`;
check("progress and note stored", progress?.completed_modules?.includes(domain.modules[0].id) && progress?.notes?.[domain.modules[0].id] === "Gradient descent recap", progress);

section("Assessments are scored on the server");
const assessments = moduleAssessments(DOMAIN);
const first = assessments[0];
res = await student.get(`/api/assessments/${first.id}`);
check("questions load for an enrolled student", res.status === 200 && res.json?.questions?.length === first.questions.length, res.status);
check("questions never include answers or explanations", !/"correct"|explanation/.test(res.text), res.text.slice(0, 200));

res = await student.post("/api/assessments/submit", { assessmentId: first.id, answers: wrongAnswers(first) });
check("failed attempt recorded", res.status === 200 && res.json?.attempt?.passed === false, res.text);
check("failed attempt reveals no per-question correctness", Array.isArray(res.json?.review) && res.json.review.length === 0, res.json?.review);
check("attempts remaining reported", typeof res.json?.attemptsRemaining === "number", res.json?.attemptsRemaining);

res = await student.post("/api/assessments/submit", {
  assessmentId: first.id,
  answers: { ...correctAnswers(first), "made-up-question": [0] },
});
check("passing attempt", res.json?.attempt?.passed === true && res.json?.attempt?.percentage === 100, res.text);
check("passing attempt returns the full review with explanations", res.json?.review?.length === first.questions.length && res.json.review.every((r) => "correctOptions" in r), res.json?.review?.[0]);

res = await student.post("/api/assessments/submit", { assessmentId: first.id, answers: correctAnswers(first), score: 100, passed: true });
const [stored] = await sql`select score, total from public.assessment_attempts where student_id = ${me.id} and assessment_id = ${first.id} order by submitted_at desc limit 1`;
check("client-supplied score fields are ignored", stored?.score === first.questions.length, stored);

section("Attempt cap (5 per assessment per 24 hours)");
const second = assessments[1];
let capped = null;
for (let i = 0; i < 7; i += 1) {
  res = await student.post("/api/assessments/submit", { assessmentId: second.id, answers: wrongAnswers(second) });
  if (res.status === 429) {
    capped = i;
    break;
  }
}
check("6th attempt within 24h is refused with 429", capped === 5, `refused at attempt ${capped === null ? "never" : capped + 1}`);

section("Final assessment stays locked until every module assessment is passed");
const earlyFinal = finalAssessment(DOMAIN);
res = await student.get(`/api/assessments/${earlyFinal.id}`);
check("final questions refused while module assessments are unpassed (403)", res.status === 403, res.text);
res = await student.post("/api/assessments/submit", { assessmentId: earlyFinal.id, answers: correctAnswers(earlyFinal) });
check("final attempt refused while module assessments are unpassed (403)", res.status === 403, res.text);
const [{ count: earlyFinalRows }] = await sql`
  select count(*)::int as count from public.assessment_attempts where student_id = ${me.id} and kind = 'final'`;
check("no final attempt recorded", earlyFinalRows === 0, earlyFinalRows);

section("Pass every module assessment");
for (const assessment of assessments.slice(1)) {
  if (assessment.id === second.id) {
    await sql`delete from public.assessment_attempts where student_id = ${me.id} and assessment_id = ${second.id}`;
  }
  res = await student.post("/api/assessments/submit", { assessmentId: assessment.id, answers: correctAnswers(assessment) });
  if (res.json?.attempt?.passed !== true) {
    check(`pass ${assessment.id}`, false, res.text);
    break;
  }
}
const [{ count: passedCount }] = await sql`
  select count(distinct assessment_id)::int as count from public.assessment_attempts
  where student_id = ${me.id} and kind = 'module' and passed`;
check("all module assessments passed", passedCount === assessments.length, `${passedCount}/${assessments.length}`);
const [afterModules] = await sql`select completed_modules from public.module_progress where student_id = ${me.id} and domain_id = ${DOMAIN}`;
check("passing a module assessment completes the module", afterModules.completed_modules.length === domain.modules.length, afterModules.completed_modules.length);

section("Certificate stays locked until every requirement is met");
res = await student.post("/api/certificates/issue", {});
check("certificate refused before the practical task and final (403)", res.status === 403, res.text);

section("Practical task upload to S3");
const task = domain.practicalTask;
const ext = (task.acceptedFileTypes?.[0] ?? ".pdf").replace(/^\./, "");
const fileName = `report.${ext}`;
const contentType = ext === "pdf" ? "application/pdf" : ext === "ipynb" ? "application/x-ipynb+json" : "application/octet-stream";
const bytes = Buffer.from("%PDF-1.4\nRoystian journey test report\n%%EOF\n");
res = await student.post("/api/uploads", { purpose: "submission", domainId: DOMAIN, fileName, contentType, size: bytes.length });
check("presigned upload issued", res.status === 200 && res.json?.url && res.json?.fields && res.json?.key, res.text);
const upload = res.json;
check("upload key is under the student's own prefix", upload?.key?.split("/")[1] === me.id, upload?.key);
const form = new FormData();
for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
form.append("file", new Blob([bytes], { type: contentType }), fileName);
const s3 = await fetch(upload.url, { method: "POST", body: form });
check("browser-style upload straight to S3 succeeds", s3.status === 204 || s3.status === 201 || s3.status === 200, s3.status);

const response = "x".repeat(Math.max(task.minResponseLength ?? 200, 200)) + " Approach, findings, and results of the model evaluation.";
res = await student.post("/api/student/submission", { domainId: DOMAIN, responseText: response, fileKey: upload.key, fileName });
check("practical task submitted with the uploaded file", res.status === 200, res.text);
const [submission] = await sql`select * from public.submissions where student_id = ${me.id} and domain_id = ${DOMAIN}`;
check("submission stored with the S3 key", submission?.status === "submitted" && submission?.file_path === upload.key, submission);

res = await student.post("/api/certificates/issue", {});
check("certificate refused while the practical is only submitted, not approved (403)", res.status === 403, res.text);

section("Trainer reviews the submission");
const trainer = new Client("journey-trainer");
await newStaff(trainer, "trainer", { trainerDomains: [DOMAIN] });
res = await trainer.post("/api/admin/files", { kind: "submission", id: submission.id });
check("trainer gets a short-lived download link", res.status === 200 && /X-Amz-Expires=300/.test(res.json?.url ?? ""), res.text);
const download = await fetch(res.json.url);
check("download link returns the uploaded file", download.status === 200 && (await download.text()).includes("Roystian journey test report"), download.status);
res = await trainer.post("/api/admin/submissions/review", { submissionId: submission.id, status: "approved", feedback: "Clear evaluation." });
check("trainer approves the submission", res.status === 200, res.text);
res = await student.post("/api/student/submission", { domainId: DOMAIN, responseText: response, fileKey: upload.key, fileName });
check("an approved submission cannot be changed by the student (409)", res.status === 409, res.status);

section("Final assessment and certificate");
const final = finalAssessment(DOMAIN);
res = await student.post("/api/assessments/submit", { assessmentId: final.id, answers: correctAnswers(final) });
check("final assessment passed", res.json?.attempt?.passed === true, res.text);

res = await student.post("/api/certificates/issue", {});
check("Industry-Led certificate waits for the 15-day programme duration (403)", res.status === 403, res.text);
// Simulate the 15 days passing.
await sql`update public.students set enrolled_at = now() - interval '16 days' where id = ${me.id}`;
res = await student.post("/api/certificates/issue", {});
check("certificate issued once every requirement is met", res.status === 200 && /^RF-AIML-\d{4}-\d{6}$/.test(res.json?.certificate?.id ?? ""), res.text);
const certificateId = res.json?.certificate?.id;
res = await student.post("/api/certificates/issue", {});
check("issuing again returns the same certificate", res.json?.certificate?.id === certificateId, res.json?.certificate?.id);
const [registration] = await sql`select internship_status from public.registrations where id = ${registrationId}`;
check("registration marked certified", registration?.internship_status === "certified", registration);

section("Public verification");
const anon = new Client("verifier");
res = await anon.get(`/api/certificates/verify/${certificateId}`);
check("anyone can verify the certificate", res.status === 200 && res.json?.certificate?.status === "valid", res.text);
check("verification exposes only certificate fields", !/student_id|registration_id|email/.test(res.text), res.text);
res = await anon.get(`/api/certificates/verify/${certificateId.toLowerCase()}`);
check("verification is case-insensitive", res.status === 200, res.status);
res = await anon.get("/api/certificates/verify/RF-NOPE-2026-000000");
check("unknown certificate → 404", res.status === 404, res.status);
res = await anon.get(`/verify/${certificateId}`);
check("public verification page renders", res.status === 200 && res.text.includes(certificateId), res.status);

section("Transactional email");
const mine = sentEmails().filter((m) => m.to === me.email);
check("verification code was emailed at sign-up", mine.some((m) => /verification code/i.test(m.subject)), mine.map((m) => m.subject));
check("payment confirmation email sent", mine.some((m) => /Welcome|confirmed|registration/i.test(m.subject ?? "")), mine.map((m) => m.subject));
check("certificate email sent", mine.some((m) => /certificate/i.test(m.subject ?? "")), mine.map((m) => m.subject));
const logs = await sql`select event, status, provider_message_id from public.communication_logs where recipient = ${me.email}`;
check("communication log records each message as sent with a message id", logs.length >= 2 && logs.every((l) => l.status === "sent" && l.provider_message_id), logs);

await finish("journey");
