/**
 * End-to-end student journey against a running dev server and the LOCAL
 * Supabase stack:
 *
 *   npx supabase db reset && npm run dev   # in one terminal
 *   npm run test:journey                   # in another (BASE_URL defaults to :3000)
 *
 * Signs up a fresh student and walks signup → enrolment → assessments →
 * practical task → final → certificate → public verification through the
 * real API routes, asserting the server enforces every rule.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
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

// The curriculum (and so the answer key) comes from the compiled app code.
execSync("npx tsc -p tsconfig.selftest.json", { stdio: "inherit" });
const require = createRequire(import.meta.url);
require("../.selftest-register.cjs");
const { getDomain, getDomainAssessments, getFinalAssessment } = require("../.selftest/data/domains.js");
const { getProgram } = require("../.selftest/data/programs.js");

let failures = 0;
function check(label, condition, detail) {
  console.log(`${condition ? "ok  " : "FAIL"}  ${label}${!condition && detail ? ` — ${detail}` : ""}`);
  if (!condition) failures += 1;
}

// A cookie-backed session, exactly as the browser would hold it.
const jar = new Map();
const supabase = createServerClient(SUPABASE_URL, ANON, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
  },
});
const cookieHeader = () => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");

async function api(path, body, { auth = true } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { cookie: cookieHeader() } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const correctAnswers = (assessment) =>
  Object.fromEntries(assessment.questions.map((q) => [q.id, q.correct]));

const DOMAIN = "data-analytics";
const domain = getDomain(DOMAIN);

// Signup -------------------------------------------------------------------
const email = `journey-${Date.now()}@journey-test.example`;
{
  const { data, error } = await supabase.auth.signUp({
    email,
    password: "journey-pass-1",
    options: {
      data: {
        full_name: "Journey Tester",
        mobile: "+91 90000 55555",
        college: "Journey Test College",
        course: "B.Sc Statistics",
        city: "Pune",
        education_level: "undergraduate",
      },
    },
  });
  check("fresh student signs up", !error && data.session, error?.message);
}

// Enrolment ----------------------------------------------------------------
{
  const anonymous = await api("/api/enrolments", { domainId: DOMAIN }, { auth: false });
  check("enrolment requires sign-in", anonymous.status === 401, anonymous.status);

  const early = await api("/api/certificates/issue");
  check("certificate refused before enrolment", early.status === 400, early.status);

  const enrol = await api("/api/enrolments", {
    domainId: DOMAIN,
    programId: "self-paced",
    experience: "beginner",
    method: "upi",
  });
  check(
    "student enrols",
    enrol.status === 200 && /^RF-[A-Z]+-\d{4}-\d{6}$/.test(enrol.body.registration?.id ?? ""),
    JSON.stringify(enrol.body),
  );

  const again = await api("/api/enrolments", {
    domainId: DOMAIN,
    programId: "self-paced",
    experience: "beginner",
    method: "upi",
  });
  check("second enrolment in the same domain is refused", again.status === 409, again.status);

  const { data: rows } = await supabase.from("registrations").select("amount_paise");
  check(
    "amount charged is the server-side catalogue price",
    rows?.[0]?.amount_paise === getProgram("self-paced").price * 100,
    JSON.stringify(rows),
  );

  const notYet = await api("/api/certificates/issue");
  check("certificate refused while requirements are incomplete", notYet.status === 403, notYet.status);
}

// Assessments --------------------------------------------------------------
const moduleAssessments = getDomainAssessments(DOMAIN);
{
  const first = moduleAssessments[0];
  const wrong = Object.fromEntries(first.questions.map((q) => [q.id, []]));
  const failed = await api("/api/assessments/submit", { assessmentId: first.id, answers: wrong });
  check("wrong answers are scored as a fail", failed.status === 200 && failed.body.attempt?.passed === false);

  const otherDomain = getFinalAssessment("sustainability");
  const foreign = await api("/api/assessments/submit", {
    assessmentId: otherDomain.id,
    answers: correctAnswers(otherDomain),
  });
  check("assessments in unpaid domains are refused", foreign.status === 403, foreign.status);

  let allPassed = true;
  for (const assessment of moduleAssessments) {
    const res = await api("/api/assessments/submit", {
      assessmentId: assessment.id,
      answers: correctAnswers(assessment),
    });
    allPassed &&= res.status === 200 && res.body.attempt?.passed === true;
  }
  check(`all ${moduleAssessments.length} module assessments pass with correct answers`, allPassed);

  const { data: progress } = await supabase
    .from("module_progress")
    .select("completed_modules")
    .eq("domain_id", DOMAIN)
    .single();
  check(
    "passing a module assessment completes the module",
    domain.modules.every((m) => progress?.completed_modules?.includes(m.id)),
    JSON.stringify(progress),
  );
}

// Practical task -----------------------------------------------------------
{
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("submissions").upsert(
    {
      student_id: user.id,
      domain_id: DOMAIN,
      task_title: domain.practicalTask.title,
      response_text: "Analysis of the dataset with findings and recommendations.",
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "student_id,domain_id" },
  );
  check("student submits the practical task", !error, error?.message);

  const stillLocked = await api("/api/certificates/issue");
  check("certificate refused before the final assessment", stillLocked.status === 403, stillLocked.status);
}

// Final + certificate ------------------------------------------------------
let certificateId;
{
  const final = getFinalAssessment(DOMAIN);
  const res = await api("/api/assessments/submit", {
    assessmentId: final.id,
    answers: correctAnswers(final),
  });
  check("final assessment passes", res.body.attempt?.passed === true);

  const issued = await api("/api/certificates/issue");
  certificateId = issued.body.certificate?.id;
  check("certificate is issued once every requirement is met", issued.status === 200 && certificateId);

  const repeat = await api("/api/certificates/issue");
  check("issuing again returns the same certificate", repeat.body.certificate?.id === certificateId);

  const { data: notes } = await supabase.from("notifications").select("title");
  check(
    "server wrote enrolment and certificate notifications",
    notes?.some((n) => n.title === "Registration confirmed") &&
      notes?.some((n) => n.title === "Certificate unlocked"),
    JSON.stringify(notes),
  );
}

// Public verification ------------------------------------------------------
{
  const anon = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
  const { data } = await anon.rpc("verify_certificate", { certificate_id: certificateId.toLowerCase() });
  check(
    "anyone can verify the certificate",
    data?.[0]?.status === "valid" && data[0].student_name === "Journey Tester",
    JSON.stringify(data),
  );
  check("verification does not expose the score", data?.[0] && !("final_score" in data[0]));
}

console.log(failures === 0 ? "\nJOURNEY PASSED" : `\n${failures} JOURNEY CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
