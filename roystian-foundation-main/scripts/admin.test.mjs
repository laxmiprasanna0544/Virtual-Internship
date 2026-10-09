/**
 * Admin console actions against a running dev server and the LOCAL Supabase
 * stack (same setup as test:journey):
 *
 *   npx supabase db reset && npm run dev
 *   npm run test:admin
 *
 * Checks that every /api/admin route enforces roles, does what it says, and
 * leaves an audit trail.
 */
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!/127\.0\.0\.1|localhost/.test(SUPABASE_URL)) {
  console.error("Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not local.");
  process.exit(1);
}

let failures = 0;
function check(label, condition, detail) {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${!condition && detail !== undefined ? ` — ${detail}` : ""}`);
  if (!condition) failures += 1;
}

/** A cookie-backed session, as a browser would hold it. */
function session() {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const api = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; "),
      },
      body: JSON.stringify(body ?? {}),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  return { supabase, api };
}

async function signIn(email, password) {
  const s = session();
  const { error } = await s.supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return s;
}

async function newStudent(label, domainId) {
  const s = session();
  const email = `${label}-${Date.now()}@admin-test.example`;
  const { data, error } = await s.supabase.auth.signUp({
    email,
    password: "admin-test-pass-1",
    options: {
      data: { full_name: `Admin Test ${label}`, mobile: "+91 90000 77777", college: "Test College", course: "B.Tech", city: "Pune" },
    },
  });
  if (error) throw new Error(error.message);
  const enrol = await s.api("/api/enrolments", {
    domainId,
    programId: "self-paced",
    experience: "beginner",
    method: "upi",
  });
  if (enrol.status !== 200) throw new Error(`enrol failed: ${JSON.stringify(enrol.body)}`);
  await s.supabase.from("submissions").upsert(
    {
      student_id: data.user.id,
      domain_id: domainId,
      task_title: "Practical task",
      response_text: "My analysis.",
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "student_id,domain_id" },
  );
  return { ...s, id: data.user.id, email, password: "admin-test-pass-1" };
}

const anon = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
const admin = await signIn("admin@roystian.demo", "admin123");
const trainer = await signIn("trainer@roystian.demo", "trainer123");
// Trainer teaches ai-ml, data-analytics and software-development.
const inDomain = await newStudent("in-domain", "data-analytics");
const outOfDomain = await newStudent("out-of-domain", "sustainability");

const submissionOf = async (studentId) =>
  (await admin.supabase.from("submissions").select("id, status").eq("student_id", studentId).single()).data;

// Role enforcement ---------------------------------------------------------
{
  const unauth = await fetch(`${BASE_URL}/api/admin/payments/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  check("admin routes reject anonymous callers", unauth.status === 401, unauth.status);

  const asStudent = await inDomain.api("/api/admin/students/status", {
    studentId: inDomain.id,
    status: "suspended",
  });
  check("students cannot call admin routes", asStudent.status === 403, asStudent.status);

  const { data: payment } = await admin.supabase.from("payments").select("id").eq("student_id", inDomain.id).single();
  const trainerRefund = await trainer.api("/api/admin/payments/refund", { paymentId: payment.id });
  check("trainers cannot refund payments", trainerRefund.status === 403, trainerRefund.status);
}

// Admin data visibility ----------------------------------------------------
{
  const { data: adminStudents } = await admin.supabase.from("students").select("id");
  const ids = (adminStudents ?? []).map((s) => s.id);
  check("admin sees newly registered students", ids.includes(inDomain.id) && ids.includes(outOfDomain.id));

  const { data: trainerStudents } = await trainer.supabase.from("students").select("id");
  const tids = (trainerStudents ?? []).map((s) => s.id);
  check(
    "trainer sees only students in their domains",
    tids.includes(inDomain.id) && !tids.includes(outOfDomain.id),
  );
}

// Submission review --------------------------------------------------------
{
  const own = await submissionOf(inDomain.id);
  const review = await trainer.api("/api/admin/submissions/review", {
    submissionId: own.id,
    status: "approved",
    feedback: "Well structured.",
  });
  check("trainer approves a submission in their domain", review.status === 200, JSON.stringify(review.body));
  check("approval is saved", (await submissionOf(inDomain.id)).status === "approved");

  const { data: note } = await inDomain.supabase
    .from("notifications")
    .select("title")
    .eq("title", "Practical task approved");
  check("student is notified of the review", note?.length === 1);

  const foreign = await submissionOf(outOfDomain.id);
  const refused = await trainer.api("/api/admin/submissions/review", {
    submissionId: foreign.id,
    status: "approved",
    feedback: "",
  });
  check("trainer cannot review outside their domains", refused.status === 403, refused.status);
}

// Progress overrides and certificate issue -------------------------------------
let certificateId;
{
  const early = await admin.api("/api/admin/certificates/issue", { studentId: inDomain.id });
  check("admin issue still enforces the completion rules", early.status === 403, early.status);

  const all = await admin.api("/api/admin/students/progress", {
    action: "all-modules",
    studentId: inDomain.id,
    complete: true,
  });
  const final = await admin.api("/api/admin/students/progress", {
    action: "final",
    studentId: inDomain.id,
    passed: true,
  });
  check("admin records module and final results", all.status === 200 && final.status === 200);

  const { data: overrides } = await admin.supabase
    .from("assessment_attempts")
    .select("overridden_by")
    .eq("student_id", inDomain.id);
  check(
    "admin-entered results are marked as overrides",
    overrides?.length > 0 && overrides.every((a) => a.overridden_by),
  );

  const issued = await admin.api("/api/admin/certificates/issue", { studentId: inDomain.id });
  certificateId = issued.body.certificate?.id;
  check("admin issues the certificate once requirements are met", issued.status === 200 && certificateId);
}

// Revoke / restore ----------------------------------------------------------
{
  await admin.api("/api/admin/certificates/status", {
    certificateId,
    status: "revoked",
    reason: "Test revocation",
  });
  const { data: revoked } = await anon.rpc("verify_certificate", { certificate_id: certificateId });
  check("revoked certificate verifies as revoked", revoked?.[0]?.status === "revoked");

  await admin.api("/api/admin/certificates/status", { certificateId, status: "valid" });
  const { data: restored } = await anon.rpc("verify_certificate", { certificate_id: certificateId });
  check("restored certificate verifies as valid", restored?.[0]?.status === "valid");
}

// Suspension ------------------------------------------------------------------
{
  const suspend = await admin.api("/api/admin/students/status", {
    studentId: outOfDomain.id,
    status: "suspended",
  });
  check("admin suspends a student", suspend.status === 200, JSON.stringify(suspend.body));
  const blocked = await session().supabase.auth.signInWithPassword({
    email: outOfDomain.email,
    password: outOfDomain.password,
  });
  check("suspended student cannot sign in", Boolean(blocked.error));

  await admin.api("/api/admin/students/status", { studentId: outOfDomain.id, status: "active" });
  const back = await session().supabase.auth.signInWithPassword({
    email: outOfDomain.email,
    password: outOfDomain.password,
  });
  check("reactivated student can sign in again", !back.error, back.error?.message);
}

// Refund -----------------------------------------------------------------------
{
  const { data: payment } = await admin.supabase
    .from("payments")
    .select("id")
    .eq("student_id", outOfDomain.id)
    .single();
  const refund = await admin.api("/api/admin/payments/refund", { paymentId: payment.id });
  check("admin records a refund", refund.status === 200, JSON.stringify(refund.body));

  const again = await admin.api("/api/admin/payments/refund", { paymentId: payment.id });
  check("a payment cannot be refunded twice", again.status === 409, again.status);

  const fresh = await signIn(outOfDomain.email, outOfDomain.password);
  const progress = await fresh.supabase.rpc("set_module_complete", {
    target_domain: "sustainability",
    target_module: "sustainability-m01",
    complete: true,
  });
  check("refunded student loses access to the domain", Boolean(progress.error));
}

// Audit trail --------------------------------------------------------------------
{
  const { data: log } = await admin.supabase.from("admin_audit_log").select("action");
  const actions = new Set((log ?? []).map((row) => row.action));
  const expected = [
    "submission.review",
    "progress.all-modules",
    "progress.final",
    "certificate.issue",
    "certificate.revoke",
    "certificate.restore",
    "student.suspend",
    "student.reactivate",
    "payment.refund",
  ];
  const missing = expected.filter((a) => !actions.has(a));
  check("every admin action is in the audit log", missing.length === 0, missing.join(", "));

  const { data: hidden } = await trainer.supabase.from("admin_audit_log").select("id");
  check("only admins can read the audit log", (hidden ?? []).length === 0);
}

console.log(failures === 0 ? "\nADMIN CHECKS PASSED" : `\n${failures} ADMIN CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
