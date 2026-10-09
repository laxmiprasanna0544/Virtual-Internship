/**
 * Row level security checks against the LOCAL Supabase stack.
 *
 *   npx supabase db reset && npm run test:rls
 *
 * Signs in as each seeded role and asserts what it can and cannot read or
 * write. Never point this at production: it creates users and rows.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!/127\.0\.0\.1|localhost/.test(URL_)) {
  console.error("Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not local.");
  process.exit(1);
}

const STUDENT_ID = "00000000-0000-4000-8000-000000000001";
let failures = 0;

function check(label, condition) {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}`);
  if (!condition) failures += 1;
}

function client() {
  return createClient(URL_, ANON, { auth: { persistSession: false } });
}

async function signedIn(email, password) {
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return supabase;
}

// Anonymous ---------------------------------------------------------------
{
  const anon = client();
  const profiles = await anon.from("profiles").select("id");
  check("anon cannot read profiles", (profiles.data ?? []).length === 0);

  const verify = await anon.rpc("verify_certificate", { certificate_id: "RF-NONE-2026-000000" });
  check("anon can call verify_certificate", !verify.error && Array.isArray(verify.data));

  const lead = await anon.from("college_leads").insert({
    college_name: "RLS Test College",
    contact_person: "Test Officer",
    email: "tpo@rls-test.example",
  });
  check("anon can submit a college lead", !lead.error);

  const leads = await anon.from("college_leads").select("id");
  check("anon cannot read college leads", (leads.data ?? []).length === 0);
}

// Signup cannot self-assign a role -----------------------------------------
const outsiderEmail = `outsider-${Date.now()}@rls-test.example`;
let outsiderId;
{
  const anon = client();
  const { data, error } = await anon.auth.signUp({
    email: outsiderEmail,
    password: "outsider-pass-1",
    options: { data: { full_name: "Outsider", role: "admin", college: "Some Other College" } },
  });
  check("signup succeeds", !error && data.user);
  outsiderId = data.user?.id;
  const me = await anon.from("profiles").select("role").eq("id", outsiderId).single();
  check("signup with role=admin metadata still becomes a student", me.data?.role === "student");
}

// Student -----------------------------------------------------------------
{
  const s = await signedIn("student@roystian.demo", "student123");

  const profiles = await s.from("profiles").select("id");
  check("student sees only their own profile", profiles.data?.length === 1 && profiles.data[0].id === STUDENT_ID);

  const others = await s.from("students").select("id").neq("id", STUDENT_ID);
  check("student cannot see other students", (others.data ?? []).length === 0);

  const rename = await s.from("profiles").update({ full_name: "Rahul Sharma" }).eq("id", STUDENT_ID);
  check("student can update their own name", !rename.error);

  const promote = await s.from("profiles").update({ role: "admin" }).eq("id", STUDENT_ID);
  check("student cannot change their role", Boolean(promote.error));

  const enrol = await s.from("students").update({ program_id: "industry-led" }).eq("id", STUDENT_ID);
  check("student cannot change their enrolment", Boolean(enrol.error));

  const registration = await s.from("registrations").insert({
    id: "RF-TEST-2026-999999",
    student_id: STUDENT_ID,
    domain_id: "ai-ml",
    program_id: "industry-led",
    experience: "beginner",
    amount_paise: 0,
    payment_status: "successful",
  });
  check("student cannot create a registration", Boolean(registration.error));

  const payment = await s.from("payments").insert({
    student_id: STUDENT_ID,
    amount_paise: 0,
    status: "successful",
    provider_order_id: "fake-order",
  });
  check("student cannot create a payment", Boolean(payment.error));

  const attempt = await s.from("assessment_attempts").insert({
    student_id: STUDENT_ID,
    domain_id: "ai-ml",
    assessment_id: "final",
    kind: "final",
    score: 10,
    total: 10,
    percentage: 100,
    passed: true,
  });
  check("student cannot write an assessment score", Boolean(attempt.error));

  const certificate = await s.from("certificates").insert({
    id: "RF-FAKE-2026-000001",
    student_id: STUDENT_ID,
    registration_id: "RF-TEST-2026-999999",
    domain_id: "ai-ml",
    program_id: "industry-led",
    student_name: "x",
    domain_name: "x",
    program_name: "x",
    duration: "x",
    final_score: 100,
  });
  check("student cannot issue a certificate", Boolean(certificate.error));

  const selfApprove = await s.from("submissions").insert({
    student_id: STUDENT_ID,
    domain_id: "ai-ml",
    task_title: "Practical task",
    status: "approved",
  });
  check("student cannot submit work as already approved", Boolean(selfApprove.error));

  const submit = await s
    .from("submissions")
    .insert({
      student_id: STUDENT_ID,
      domain_id: "ai-ml",
      task_title: "Practical task",
      response_text: "My work",
      status: "submitted",
      feedback: "Excellent, self-written",
    })
    .select("feedback")
    .single();
  check("student can submit their practical task", !submit.error);
  check("student-supplied reviewer feedback is discarded", submit.data?.feedback === null);

  const direct = await s.from("module_progress").upsert({
    student_id: STUDENT_ID,
    domain_id: "ai-ml",
    completed_modules: ["ai-ml-m01", "ai-ml-m02", "ai-ml-m03", "ai-ml-m04", "ai-ml-m05"],
  });
  check("student cannot write module progress directly", Boolean(direct.error));

  const viaRpc = await s.rpc("set_module_complete", {
    target_domain: "ai-ml",
    target_module: "ai-ml-m05",
    complete: true,
  });
  check("student records progress through set_module_complete", !viaRpc.error && viaRpc.data?.includes("ai-ml-m05"));

  const unpaid = await s.rpc("set_module_complete", {
    target_domain: "sustainability",
    target_module: "sustainability-m01",
    complete: true,
  });
  check("student cannot record progress in a domain they have not paid for", Boolean(unpaid.error));

  const switchUnpaid = await s.rpc("switch_active_domain", { target_domain: "sustainability" });
  check("student cannot switch to an unpaid domain", switchUnpaid.data === false);

  const ownUpload = await s.storage
    .from("submissions")
    .upload(`${STUDENT_ID}/ai-ml/test.txt`, new Blob(["hello"], { type: "text/plain" }));
  check("student can upload to their own submissions folder", !ownUpload.error);

  const foreignUpload = await s.storage
    .from("submissions")
    .upload(`${outsiderId}/ai-ml/test.txt`, new Blob(["x"], { type: "text/plain" }));
  check("student cannot upload into another student's folder", Boolean(foreignUpload.error));

  const sequence = await s.rpc("create_paid_registration", {
    p_student_id: STUDENT_ID,
    p_domain_id: "sustainability",
    p_domain_code: "SUS",
    p_program_id: "industry-led",
    p_experience: "beginner",
    p_amount_paise: 0,
    p_method: "upi",
    p_provider: "simulated",
    p_provider_order_id: "forged",
  });
  check("student cannot call create_paid_registration", Boolean(sequence.error));
}

// Trainer -----------------------------------------------------------------
{
  const t = await signedIn("trainer@roystian.demo", "trainer123");
  const students = await t.from("students").select("id");
  const ids = (students.data ?? []).map((row) => row.id);
  check("trainer sees students in their domains", ids.includes(STUDENT_ID));
  check("trainer does not see students outside their domains", !ids.includes(outsiderId));

  const review = await t
    .from("submissions")
    .update({ status: "approved", feedback: "Well done" })
    .eq("student_id", STUDENT_ID)
    .select("status")
    .single();
  check("trainer can approve a submission in their domain", review.data?.status === "approved");

  const leads = await t.from("college_leads").select("id");
  check("trainer cannot read college leads", (leads.data ?? []).length === 0);
}

// College -----------------------------------------------------------------
{
  const c = await signedIn("college@roystian.demo", "college123");
  const students = await c.from("students").select("id");
  const ids = (students.data ?? []).map((row) => row.id);
  check("college sees its own cohort", ids.includes(STUDENT_ID));
  check("college does not see other colleges' students", !ids.includes(outsiderId));

  const payments = await c.from("payments").select("id");
  check("college cannot read payments", (payments.data ?? []).length === 0);
}

// Admin -------------------------------------------------------------------
{
  const a = await signedIn("admin@roystian.demo", "admin123");
  const profiles = await a.from("profiles").select("id");
  check("admin sees every profile", (profiles.data ?? []).length >= 6);

  const leads = await a.from("college_leads").select("id");
  check("admin reads college leads", (leads.data ?? []).length >= 1);

  const promote = await a.from("profiles").update({ role: "trainer" }).eq("id", outsiderId);
  check("admin still cannot change roles through the client API", Boolean(promote.error));
}

console.log(failures === 0 ? "\nALL RLS CHECKS PASSED" : `\n${failures} RLS CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
