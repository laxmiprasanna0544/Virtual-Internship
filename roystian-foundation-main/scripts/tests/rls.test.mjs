/**
 * Row level security, column grants, function privileges and guard triggers,
 * tested directly in PostgreSQL.
 *
 * Each check runs in its own transaction that switches identity exactly like
 * lib/server/db.ts: withUser() → `authenticated` + app.user_id, withAnon() →
 * `anon`. Fixtures are created as the owner (as trusted server code would)
 * and removed at the end. No Cognito is involved.
 */
import { randomUUID } from "node:crypto";
import { check, finish, section, sql } from "./lib.mjs";

/* Identity switching, mirroring withUser()/withAnon(). */
function as(userId, fn, role = "authenticated") {
  return sql.begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId ?? ""}, true), set_config('app.role', ${role}, true)`;
    await tx.unsafe(`set local role ${role}`);
    return fn(tx);
  });
}
const anon = (fn) => as(null, fn, "anon");

/** Resolves to the Postgres error code if `fn` throws, otherwise null. */
async function errorOf(fn) {
  try {
    await fn();
    return null;
  } catch (error) {
    return error.code ?? error.message ?? "error";
  }
}
const DENIED = "42501";

/* ------------------------------------------------------------------ */
/*  Fixtures (as the owner)                                            */
/* ------------------------------------------------------------------ */

const tag = randomUUID().slice(0, 8);
const A = randomUUID(); // student, AI/ML, at the test college
const B = randomUUID(); // student, Cyber Security, elsewhere
const T = randomUUID(); // trainer for AI/ML
const C = randomUUID(); // college placement cell
const ADMIN = randomUUID();
const collegeId = `rls_college_${tag}`;
const collegeName = `RLS Test College ${tag}`;
const ids = [A, B, T, C, ADMIN];

await sql`insert into public.colleges (id, name, type) values (${collegeId}, ${collegeName}, 'engineering')`;
// Every profile belongs to a sign-in identity (unusable hashes: these accounts never sign in).
for (const [id, label] of [[A, "a"], [B, "b"], [T, "trainer"], [C, "college"], [ADMIN, "admin"]]) {
  await sql`insert into identity.users (id, email, password_hash, email_verified_at) values (${id}, ${`${label}.${tag}@rls.test`}, 'disabled', now())`;
}
await sql`select public.provision_student(${A}, ${`a.${tag}@rls.test`}, 'Student A', '9000000001', ${collegeName}, 'B.Tech', 'Hyderabad', 'undergraduate')`;
await sql`select public.provision_student(${B}, ${`b.${tag}@rls.test`}, 'Student B', '9000000002', 'Another College', 'B.Tech', 'Pune', 'undergraduate')`;
for (const [id, role] of [
  [T, "trainer"],
  [C, "college"],
  [ADMIN, "admin"],
]) {
  await sql`select public.provision_student(${id}, ${`${role}.${tag}@rls.test`}, ${`Test ${role}`}, '', '', '', '', 'undergraduate')`;
  await sql`delete from public.students where id = ${id}`;
  await sql`update public.profiles set role = ${role}, college_id = ${role === "college" ? collegeId : null} where id = ${id}`;
}
await sql`insert into public.trainers (id, profile_id, name, domains) values (${`rls-trainer-${tag}`}, ${T}, 'RLS trainer', ${["ai-ml"]})`;
await sql`insert into public.trainers (id, name, domains, active) values (${`rls-inactive-${tag}`}, 'Inactive trainer', ${["ai-ml"]}, false)`;

async function paidRegistration(studentId, domainId, code) {
  const order = `RLS-${tag}-${studentId.slice(0, 6)}-${domainId}`;
  await sql`
    insert into public.payments (student_id, amount_paise, status, provider, provider_order_id, domain_id, program_id, experience)
    values (${studentId}, 150000, 'pending', 'cashfree', ${order}, ${domainId}, 'self-paced', 'beginner')`;
  const [reg] = await sql`select * from public.complete_payment(${order}, 150000, 'upi', 'pay-1', '{}'::jsonb, ${code})`;
  return reg;
}
const regA = await paidRegistration(A, "ai-ml", "AIML");
const regB = await paidRegistration(B, "cyber-security", "CYBR");

for (const [id, domain] of [
  [A, "ai-ml"],
  [B, "cyber-security"],
]) {
  await sql`
    insert into public.assessment_attempts (student_id, domain_id, assessment_id, kind, score, total, percentage, passed)
    values (${id}, ${domain}, ${`${domain}-m01-assessment`}, 'module', 4, 5, 80, true)`;
  await sql`insert into public.notifications (user_id, type, title) values (${id}, 'system', 'Hello')`;
  await sql`insert into public.resume_drafts (student_id, headline) values (${id}, 'Draft')`;
  await sql`insert into public.career_passports (student_id, slug) values (${id}, ${`rls-${tag}-${id.slice(0, 6)}`})`;
  await sql`insert into public.scholarship_applications (student_id, requested_tier, statement) values (${id}, 50, 'Need support')`;
}
await sql`select * from public.issue_certificate(${B}, ${regB.id}, 'CYBR', 'Student B', 'Cyber Security', 'Self-Paced', '15 Days', 90)`;
await sql`
  insert into public.submissions (student_id, domain_id, task_title, response_text, status, submitted_at)
  values (${B}, 'cyber-security', 'Task', 'Response', 'submitted', now())`;
await sql`insert into public.college_leads (college_name, contact_person, email) values (${`Lead ${tag}`}, 'Someone', 'lead@rls.test')`;

const tablesWithStudent = [
  ["registrations", "student_id"],
  ["payments", "student_id"],
  ["assessment_attempts", "student_id"],
  ["submissions", "student_id"],
  ["certificates", "student_id"],
  ["notifications", "user_id"],
  ["resume_drafts", "student_id"],
  ["scholarship_applications", "student_id"],
  ["module_progress", "student_id"],
];

/* ------------------------------------------------------------------ */

section("A student sees only their own records");
for (const [table, column] of [["profiles", "id"], ["students", "id"], ...tablesWithStudent]) {
  const rows = await as(A, (tx) => tx.unsafe(`select ${column} as owner from public.${table} where ${column} = any($1)`, [[A, B]]));
  check(`${table}: no other student's rows`, rows.every((r) => r.owner === A), rows.length);
}
const ownRegistrations = await as(A, (tx) => tx`select id from public.registrations`);
check("student sees their own registration", ownRegistrations.some((r) => r.id === regA.id), ownRegistrations);
const passports = await as(A, (tx) => tx`select student_id from public.career_passports where student_id = ${B}`);
check("another student's unpublished passport is hidden", passports.length === 0);
const allProfiles = await as(A, (tx) => tx`select count(*)::int as n from public.profiles`);
check("profiles table shows only the student themself", allProfiles[0].n === 1, allProfiles[0].n);
const leadsForStudent = await as(A, (tx) => tx`select count(*)::int as n from public.college_leads`);
check("students cannot read college leads", leadsForStudent[0].n === 0, leadsForStudent[0].n);
const audit = await as(A, (tx) => tx`select count(*)::int as n from public.admin_audit_log`);
check("students cannot read the audit log", audit[0].n === 0, audit[0].n);
const comms = await as(A, (tx) => tx`select count(*)::int as n from public.communication_logs`);
check("students cannot read the communication log", comms[0].n === 0, comms[0].n);

section("Column grants: what a student may change about themself");
let updated = await as(A, (tx) => tx`update public.profiles set full_name = 'Renamed A' where id = ${A} returning id`);
check("own name can be changed", updated.length === 1);
updated = await as(A, (tx) => tx`update public.profiles set full_name = 'Hacked' where id = ${B} returning id`);
check("another student's name cannot be changed (0 rows)", updated.length === 0);
for (const [table, set] of [
  ["profiles", "role = 'admin'"],
  ["profiles", `college_id = '${collegeId}'`],
  ["profiles", "mfa_enabled = true"],
  ["profiles", "email = 'x@evil.test'"],
  ["students", "status = 'active'"],
  ["students", "domain_id = 'cyber-security'"],
  ["students", `active_registration_id = '${regB.id}'`],
  ["students", "enrolled_at = now()"],
]) {
  const code = await errorOf(() => as(A, (tx) => tx.unsafe(`update public.${table} set ${set} where id = $1`, [A])));
  check(`${table}.${set.split(" ")[0]} cannot be changed by the student`, code === DENIED, code);
}
const [profileA] = await sql`select role, college_id, mfa_enabled from public.profiles where id = ${A}`;
check("role, college and MFA flag unchanged", profileA.role === "student" && profileA.college_id === null && profileA.mfa_enabled === false, profileA);

section("Students cannot create trusted records");
for (const [label, query] of [
  ["registrations", (tx) => tx`insert into public.registrations (id, student_id, domain_id, program_id, experience, amount_paise, payment_status) values (${`RF-X-${tag}`}, ${A}, 'web-development', 'self-paced', 'beginner', 0, 'successful')`],
  ["payments", (tx) => tx`insert into public.payments (student_id, amount_paise, status, provider_order_id) values (${A}, 0, 'successful', ${`X-${tag}`})`],
  ["assessment_attempts", (tx) => tx`insert into public.assessment_attempts (student_id, domain_id, assessment_id, kind, score, total, percentage, passed) values (${A}, 'ai-ml', 'ai-ml-final', 'final', 10, 10, 100, true)`],
  ["certificates", (tx) => tx`insert into public.certificates (id, student_id, registration_id, domain_id, program_id, student_name, domain_name, program_name, duration, final_score) values (${`RF-FAKE-${tag}`}, ${A}, ${regA.id}, 'ai-ml', 'self-paced', 'A', 'AI', 'SP', '15', 100)`],
  ["notifications for others", (tx) => tx`insert into public.notifications (user_id, type, title) values (${B}, 'system', 'spoof')`],
  ["interview_sessions", (tx) => tx`insert into public.interview_sessions (student_id, kind, domain_id, overall_score) values (${A}, 'hr', 'ai-ml', 100)`],
  ["fellowship_applications", (tx) => tx`insert into public.fellowship_applications (student_id, stage, readiness_at_apply) values (${A}, 'applied', 100)`],
]) {
  const code = await errorOf(() => as(A, query));
  check(`cannot insert into ${label}`, code === DENIED, code);
}

section("Students cannot run trusted functions");
for (const [name, query] of [
  ["complete_payment", (tx) => tx`select public.complete_payment('x', 1, 'upi', 'p', '{}'::jsonb, 'AIML')`],
  ["fail_payment", (tx) => tx`select public.fail_payment('x', 'r', '{}'::jsonb)`],
  ["record_refund", (tx) => tx`select public.record_refund(${randomUUID()}, 'r', '{}'::jsonb)`],
  ["provision_student", (tx) => tx`select public.provision_student(${randomUUID()}, 'x@y.z', 'x', '', '', '', '', 'undergraduate')`],
  ["issue_certificate", (tx) => tx`select public.issue_certificate(${A}, ${regA.id}, 'AIML', 'A', 'AI', 'SP', '15', 100)`],
]) {
  const code = await errorOf(() => as(A, query));
  check(`${name} is not executable by students`, code === DENIED, code);
  const anonCode = await errorOf(() => anon(query));
  check(`${name} is not executable anonymously`, anonCode === DENIED, anonCode);
}

section("Students cannot delete");
for (const table of ["notifications", "resume_drafts", "scholarship_applications", "career_passports", "assessment_attempts"]) {
  const code = await errorOf(() => as(A, (tx) => tx.unsafe(`delete from public.${table} where ${table === "notifications" ? "user_id" : "student_id"} = $1`, [A])));
  check(`${table}: delete refused`, code === DENIED, code);
}

section("Guard triggers: no self-review, evaluated work is final");
let code = await errorOf(() =>
  as(A, (tx) => tx`insert into public.submissions (student_id, domain_id, task_title, status) values (${A}, 'ai-ml', 'Task', 'approved')`),
);
check("student cannot submit a self-approved practical task", code === "P0001", code);
const [sub] = await as(A, (tx) => tx`
  insert into public.submissions (student_id, domain_id, task_title, response_text, status, feedback, reviewed_by)
  values (${A}, 'ai-ml', 'Task', 'Work', 'submitted', 'Great!', ${T})
  returning *`);
check("reviewer fields are cleared on a student insert", sub.feedback === null && sub.reviewed_by === null, sub);
code = await errorOf(() => as(A, (tx) => tx`update public.submissions set student_id = ${B} where id = ${sub.id}`));
check("submission owner cannot be changed", code === DENIED, code);
await sql`update public.submissions set status = 'approved', feedback = 'ok' where id = ${sub.id}`;
code = await errorOf(() => as(A, (tx) => tx`update public.submissions set response_text = 'Changed after approval' where id = ${sub.id}`));
check("an approved submission cannot be changed", code === "P0001", code);

code = await errorOf(() =>
  as(A, (tx) => tx`insert into public.project_submissions (student_id, project_id, domain_id, status) values (${A}, 'p-eval', 'ai-ml', 'evaluated')`),
);
check("student cannot insert an evaluated project", code === "P0001", code);
const [proj] = await as(A, (tx) => tx`
  insert into public.project_submissions (student_id, project_id, domain_id, status, overall_score, feedback)
  values (${A}, ${`proj-${tag}`}, 'ai-ml', 'submitted', 99, 'self')
  returning *`);
check("project score/feedback cleared on a student insert", proj.overall_score === null && proj.feedback === null, proj);
code = await errorOf(() => as(A, (tx) => tx`update public.project_submissions set overall_score = 100 where id = ${proj.id}`));
check("student cannot write a project score", code === DENIED, code);
code = await errorOf(() => as(A, (tx) => tx`update public.project_submissions set domain_id = 'cyber-security' where id = ${proj.id}`));
check("project domain cannot be changed", code === DENIED, code);
await sql`update public.project_submissions set status = 'evaluated', overall_score = 70 where id = ${proj.id}`;
code = await errorOf(() => as(A, (tx) => tx`update public.project_submissions set status = 'submitted', analysis = 'new' where id = ${proj.id}`));
check("an evaluated project cannot be reopened or edited", code === "P0001", code);

const [entry] = await as(A, (tx) => tx`
  insert into public.challenge_entries (student_id, challenge_id, status, solution, score)
  values (${A}, ${`ch-${tag}`}, 'submitted', 'v1', 100)
  returning *`);
check("challenge score cleared on a student insert", entry.score === null, entry);
code = await errorOf(() => as(A, (tx) => tx`update public.challenge_entries set status = 'evaluated' where id = ${entry.id}`));
check("student cannot evaluate their own challenge entry", code === "P0001", code);
await sql`update public.challenge_entries set status = 'evaluated', score = 75 where id = ${entry.id}`;
code = await errorOf(() => as(A, (tx) => tx`update public.challenge_entries set status = 'submitted', solution = 'v2' where id = ${entry.id}`));
check("an evaluated challenge entry cannot be resubmitted", code === "P0001", code);
const deleted = await errorOf(() => as(A, (tx) => tx`delete from public.challenge_entries where id = ${entry.id}`));
check("an evaluated challenge entry cannot be deleted", deleted === DENIED, deleted);
const [entryAfter] = await sql`select status, score, solution from public.challenge_entries where id = ${entry.id}`;
check("challenge entry unchanged", entryAfter.status === "evaluated" && entryAfter.score === 75 && entryAfter.solution === "v1", entryAfter);

updated = await as(A, (tx) => tx`update public.scholarship_applications set status = 'approved', awarded_tier = 100 where student_id = ${A} returning id`);
const [scholarshipA] = await sql`select status, awarded_tier from public.scholarship_applications where student_id = ${A}`;
check("student cannot approve their own scholarship (no update policy)", updated.length === 0 && scholarshipA.status === "submitted" && scholarshipA.awarded_tier === null, scholarshipA);

section("Enrolment functions respect payment");
let [switched] = await as(A, (tx) => tx`select public.switch_active_domain('cyber-security') as ok`);
check("cannot switch to an unpaid domain", switched.ok === false, switched);
[switched] = await as(A, (tx) => tx`select public.switch_active_domain('ai-ml') as ok`);
check("can switch to a paid domain", switched.ok === true, switched);
code = await errorOf(() => as(A, (tx) => tx`select public.set_module_complete('cyber-security', 'cyber-security-m01', true)`));
check("set_module_complete refused for an unpaid domain", code === DENIED, code);
const [done] = await as(A, (tx) => tx`select public.set_module_complete('ai-ml', 'ai-ml-m01', true) as modules`);
check("set_module_complete works for a paid domain", done.modules.includes("ai-ml-m01"), done);
code = await errorOf(() => as(A, (tx) => tx`select public.save_module_note('cyber-security', 'cyber-security-m01', 'n')`));
check("save_module_note refused for an unpaid domain", code === DENIED, code);

section("Trainer: only students in their domains");
const trainerStudents = await as(T, (tx) => tx`select id from public.students where id in (${A}, ${B})`);
check("trainer sees the AI/ML student", trainerStudents.some((r) => r.id === A));
check("trainer does not see the Cyber Security student", !trainerStudents.some((r) => r.id === B));
const trainerCerts = await as(T, (tx) => tx`select id from public.certificates where student_id = ${B}`);
check("trainer cannot read other domains' certificates", trainerCerts.length === 0);
const trainerPayments = await as(T, (tx) => tx`select id from public.payments where student_id = ${A}`);
check("trainer cannot read payments", trainerPayments.length === 0);
// Reviews are written by the server after requireStaff + canActOnDomain; the
// request role has no update grant on reviewer columns at all.
code = await errorOf(() => as(T, (tx) => tx`update public.submissions set feedback = 'ok' where student_id = ${B}`));
check("trainer cannot write review fields directly (column grant)", code === DENIED, code);

section("College: only its own cohort");
const collegeStudents = await as(C, (tx) => tx`select id from public.students where id in (${A}, ${B})`);
check("college sees its student", collegeStudents.some((r) => r.id === A));
check("college does not see other colleges' students", !collegeStudents.some((r) => r.id === B));
const collegeRows = await as(C, (tx) => tx`select id from public.colleges`);
check("college sees only its own college record", collegeRows.length === 1 && collegeRows[0].id === collegeId, collegeRows);

section("Admin: everything");
const adminStudents = await as(ADMIN, (tx) => tx`select id from public.students where id in (${A}, ${B})`);
check("admin sees every student", adminStudents.length === 2, adminStudents.length);
const adminLeads = await as(ADMIN, (tx) => tx`select id from public.college_leads where college_name = ${`Lead ${tag}`}`);
check("admin reads college leads", adminLeads.length === 1);
const adminPayments = await as(ADMIN, (tx) => tx`select id from public.payments where student_id in (${A}, ${B})`);
check("admin reads payments", adminPayments.length === 2, adminPayments.length);
code = await errorOf(() => as(ADMIN, (tx) => tx`update public.profiles set mfa_enabled = true where id = ${ADMIN}`));
check("even an admin cannot set their own MFA flag directly", code === DENIED, code);

section("Anonymous visitors");
const anonTrainers = await anon((tx) => tx`select id from public.trainers where id in (${`rls-trainer-${tag}`}, ${`rls-inactive-${tag}`})`);
check("active trainers are public, inactive hidden", anonTrainers.length === 1 && anonTrainers[0].id === `rls-trainer-${tag}`, anonTrainers);
await sql`update public.career_passports set published = true where student_id = ${A}`;
const anonPassports = await anon((tx) => tx`select student_id from public.career_passports where student_id in (${A}, ${B})`);
check("only published passports are public", anonPassports.length === 1 && anonPassports[0].student_id === A, anonPassports);
const [certB] = await sql`select id from public.certificates where student_id = ${B}`;
const verified = await anon((tx) => tx`select * from public.verify_certificate(${certB.id.toLowerCase()})`);
check("verify_certificate works anonymously", verified.length === 1 && verified[0].status === "valid", verified);
check("verification returns no student id or score", !("student_id" in verified[0]) && !("final_score" in verified[0]), Object.keys(verified[0]));
for (const table of ["certificates", "profiles", "students", "payments", "registrations", "college_leads", "notifications", "colleges"]) {
  const rows = await anon((tx) => tx.unsafe(`select count(*)::int as n from public.${table}`));
  check(`anon reads nothing from ${table}`, rows[0].n === 0, rows[0].n);
}
// No RETURNING: anon has no select policy on leads, by design.
code = await errorOf(() => anon((tx) => tx`insert into public.college_leads (college_name, contact_person, email) values (${`Anon ${tag}`}, 'Visitor', 'v@rls.test')`));
const anonLead = await sql`select status from public.college_leads where college_name = ${`Anon ${tag}`}`;
check("anon can submit a college lead (status new)", code === null && anonLead[0]?.status === "new", code ?? anonLead);
code = await errorOf(() => anon((tx) => tx`insert into public.college_leads (college_name, contact_person, email, status) values (${`Anon2 ${tag}`}, 'Visitor', 'v@rls.test', 'closed')`));
check("anon cannot submit a lead with another status", code === DENIED, code);
code = await errorOf(() => anon((tx) => tx`update public.college_leads set status = 'closed'`));
check("anon cannot update leads", code === DENIED, code);
code = await errorOf(() => anon((tx) => tx`insert into public.notifications (user_id, type, title) values (${A}, 'system', 'x')`));
check("anon cannot write other tables", code === DENIED, code);

section("Sign-in data is out of reach of every request role");
for (const [label, run] of [
  ["student", (fn) => as(A, fn)],
  ["admin", (fn) => as(ADMIN, fn)],
]) {
  for (const table of ["users", "sessions", "codes", "mfa_challenges"]) {
    const code = await errorOf(() => run((tx) => tx.unsafe(`select * from identity.${table} limit 1`)));
    check(`${label} cannot read identity.${table} (42501)`, code === "42501", code);
  }
}
const anonCode = await errorOf(() =>
  sql.begin(async (tx) => {
    await tx`select set_config('app.role', 'anon', true)`;
    await tx`set local role anon`;
    await tx`select * from identity.users limit 1`;
  }),
);
check("anonymous visitors cannot read identity.users (42501)", anonCode === "42501", anonCode);

section("Clean-up");
await sql.begin(async (tx) => {
  await tx`delete from public.college_leads where college_name in (${`Lead ${tag}`}, ${`Anon ${tag}`})`;
  await tx`delete from public.certificates where student_id = any(${ids})`;
  await tx`update public.students set active_registration_id = null where id = any(${ids})`;
  await tx`delete from public.payments where student_id = any(${ids})`;
  await tx`delete from public.registrations where student_id = any(${ids})`;
  await tx`delete from public.trainers where id in (${`rls-trainer-${tag}`}, ${`rls-inactive-${tag}`})`;
  await tx`delete from public.notifications where user_id = any(${ids})`;
  await tx`delete from public.students where id = any(${ids})`;
  await tx`delete from public.profiles where id = any(${ids})`;
  await tx`delete from identity.users where id = any(${ids})`;
  await tx`delete from public.colleges where id = ${collegeId}`;
});
const [{ left }] = await sql`select count(*)::int as left from public.profiles where id = any(${ids})`;
check("fixtures removed", left === 0, left);

await finish("rls");
