/**
 * Career tools, public profiles, partner directory and campus visibility,
 * against a running dev server and the LOCAL Supabase stack:
 *
 *   npx supabase db reset && npm run dev
 *   npm run test:career
 *
 * Builds one student all the way to fellowship eligibility, checking on the
 * way that everything feeding the readiness score is decided by the server.
 */
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";

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

function session() {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const request = async (method, path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; "),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  return {
    supabase,
    post: (path, body) => request("POST", path, body ?? {}),
    get: (path) => request("GET", path),
  };
}

async function signIn(email, password) {
  const s = session();
  const { error } = await s.supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return s;
}

const DOMAIN = "data-analytics";
const admin = await signIn("admin@roystian.demo", "admin123");
const trainer = await signIn("trainer@roystian.demo", "trainer123");
const college = await signIn("college@roystian.demo", "college123");
const partner = await signIn("partner@roystian.demo", "partner123");

// A student at the seeded college, enrolled in a trainer's domain.
const student = session();
const { data: signup } = await student.supabase.auth.signUp({
  email: `career-${Date.now()}@career-test.example`,
  password: "career-pass-1",
  options: {
    data: {
      full_name: "Career Tester",
      mobile: "+91 90000 88888",
      college: "Vignan Institute of Technology",
      course: "B.Sc Data Science",
      city: "Hyderabad",
    },
  },
});
const studentId = signup.user.id;
await student.post("/api/enrolments", { domainId: DOMAIN, programId: "self-paced", experience: "beginner", method: "upi" });

// Interviews ----------------------------------------------------------------
{
  const forged = await student.supabase.from("interview_sessions").insert({
    student_id: studentId,
    kind: "hr",
    domain_id: DOMAIN,
    overall_score: 100,
  });
  check("students cannot write interview scores directly", Boolean(forged.error));

  const answer =
    "In my last project I analysed attendance data for 400 students. First I cleaned the dataset, then I compared terms, " +
    "and finally I presented three recommendations to the department, which adopted two of them. The result was a 12% " +
    "improvement in attendance tracking because the reports were clearer and weekly instead of monthly.";
  const res = await student.post("/api/interviews", {
    kind: "hr",
    answers: Object.fromEntries(["hr-1", "hr-2", "hr-3", "hr-4", "hr-5"].map((id) => [id, answer])),
  });
  check(
    "interview is scored and saved by the server",
    res.status === 200 && typeof res.body.session?.overallScore === "number" && res.body.feedback,
    JSON.stringify(res.body).slice(0, 160),
  );
}

// Projects --------------------------------------------------------------------
let projectId;
{
  const start = await student.supabase
    .from("project_submissions")
    .insert({ student_id: studentId, project_id: "data-analytics-project-core", domain_id: DOMAIN, status: "in-progress" })
    .select("id")
    .single();
  projectId = start.data?.id;
  check("student starts a project", !start.error, start.error?.message);

  const selfScore = await student.supabase
    .from("project_submissions")
    .update({ overall_score: 100, status: "submitted", analysis: "Approach and findings.", recommendations: "Do X." })
    .eq("id", projectId)
    .select("overall_score")
    .single();
  check("student-supplied project scores are discarded", selfScore.data?.overall_score === null, JSON.stringify(selfScore.data));

  const evaluated = await trainer.post("/api/admin/projects/evaluate", {
    submissionId: projectId,
    criterionScores: {
      "Analytical decomposition": 100,
      "Evidence quality": 80,
      "Visual design": 60,
      Recommendation: 100,
      "Not a real criterion": 0,
    },
    feedback: "Strong.",
  });
  // 100*.30 + 80*.25 + 60*.20 + 100*.25 = 87
  check(
    "trainer evaluation is weighted by the brief's criteria",
    evaluated.status === 200 && evaluated.body.overallScore === 87,
    JSON.stringify(evaluated.body),
  );
}

// Challenges --------------------------------------------------------------------
{
  const entry = await student.supabase
    .from("challenge_entries")
    .insert({
      student_id: studentId,
      challenge_id: "challenge-ai",
      status: "submitted",
      approach: "Approach",
      solution: "Solution",
      score: 100,
    })
    .select("id, score")
    .single();
  check("student-supplied challenge scores are discarded", entry.data?.score === null, JSON.stringify(entry));

  const trainerScore = await trainer.post("/api/admin/challenges/score", { entryId: entry.data.id, score: 90, feedback: "" });
  check("only admins score challenges", trainerScore.status === 403, trainerScore.status);

  const scored = await admin.post("/api/admin/challenges/score", { entryId: entry.data.id, score: 92, feedback: "Good." });
  check("admin scores a challenge entry", scored.status === 200, JSON.stringify(scored.body));
}

// Fellowship ----------------------------------------------------------------------
{
  const direct = await student.supabase.from("fellowship_applications").insert({
    student_id: studentId,
    stage: "applied",
    readiness_at_apply: 100,
  });
  check("students cannot create fellowship applications directly", Boolean(direct.error));

  const application = {
    motivation: "I want to apply data analysis to real operational problems with a team.",
    availableFrom: "2027-01-05",
    canRelocate: true,
    preferredArea: "Data",
  };
  const early = await student.post("/api/fellowship/apply", application);
  check("fellowship refused until eligible", early.status === 403, early.status);

  // Complete the internship: practical task, every assessment, certificate.
  await student.supabase.from("submissions").upsert(
    { student_id: studentId, domain_id: DOMAIN, task_title: "Practical", response_text: "Work.", status: "submitted", submitted_at: new Date().toISOString() },
    { onConflict: "student_id,domain_id" },
  );
  const { data: sub } = await admin.supabase.from("submissions").select("id").eq("student_id", studentId).single();
  await admin.post("/api/admin/submissions/review", { submissionId: sub.id, status: "approved", feedback: "" });
  await admin.post("/api/admin/students/progress", { action: "all-modules", studentId, complete: true });
  await admin.post("/api/admin/students/progress", { action: "final", studentId, passed: true });
  const cert = await student.post("/api/certificates/issue");
  check("student earns the certificate", cert.status === 200, JSON.stringify(cert.body));

  const apply = await student.post("/api/fellowship/apply", application);
  check(
    "eligible student applies; readiness is frozen by the server",
    apply.status === 200 && apply.body.application?.stage === "applied" && apply.body.application.readinessAtApply >= 70,
    JSON.stringify(apply.body),
  );

  const stage = await admin.post("/api/admin/fellowship/stage", {
    applicationId: apply.body.application?.id,
    stage: "shortlisted",
  });
  check("admin moves the application to shortlisted", stage.status === 200);
}

// Scholarship ---------------------------------------------------------------------
{
  const forged = await student.supabase
    .from("scholarship_applications")
    .insert({ student_id: studentId, requested_tier: 100, status: "approved", awarded_tier: 100, statement: "x" })
    .select("status, awarded_tier")
    .single();
  check(
    "a scholarship cannot be self-awarded",
    forged.data?.status === "submitted" && forged.data?.awarded_tier === null,
    JSON.stringify(forged),
  );
  const decided = await admin.post("/api/admin/scholarships/decide", {
    applicationId: (await admin.supabase.from("scholarship_applications").select("id").eq("student_id", studentId).single()).data.id,
    status: "approved",
    awardedTier: 75,
  });
  check("admin awards a scholarship", decided.status === 200, JSON.stringify(decided.body));
}

// Passport, public profile, partner directory ---------------------------------------
{
  const slug = `career-tester-${Date.now()}`;
  const created = await student.supabase
    .from("career_passports")
    .insert({ student_id: studentId, slug, headline: "Data intern" });
  check("student creates a passport", !created.error, created.error?.message);

  const unpublished = await session().get(`/api/profiles/${slug}`);
  check("an unpublished passport is not public", unpublished.status === 404, unpublished.status);

  await student.supabase.from("career_passports").update({ published: true }).eq("student_id", studentId);
  const visible = await session().get(`/api/profiles/${slug}`);
  const view = visible.body.profile;
  check(
    "published passport is public with readiness, projects and certificate",
    visible.status === 200 && view?.readiness?.score > 0 && view.projects.length === 1 && view.certificate,
    JSON.stringify(view).slice(0, 200),
  );
  check("contact details stay hidden by default", view?.student.email === null);

  await student.supabase
    .from("career_passports")
    .update({
      visibility: { readiness: false, projects: false, assessments: false, badges: false, certificate: false, contact: true },
    })
    .eq("student_id", studentId);
  const restricted = (await session().get(`/api/profiles/${slug}`)).body.profile;
  check(
    "hidden sections are never sent",
    restricted?.readiness === null &&
      restricted.projects.length === 0 &&
      restricted.assessments === null &&
      restricted.badges.length === 0 &&
      restricted.certificate === null &&
      restricted.student.email?.includes("@"),
    JSON.stringify(restricted).slice(0, 200),
  );

  const talent = await partner.get("/api/partner/talent");
  check(
    "partners see published passports",
    talent.status === 200 && talent.body.profiles.some((p) => p.slug === slug),
  );
  const asStudent = await student.get("/api/partner/talent");
  check("students cannot open the partner directory", asStudent.status === 403, asStudent.status);
}

// Campus visibility -----------------------------------------------------------------
{
  const { data: projects } = await college.supabase.from("project_submissions").select("student_id");
  check("the college sees its cohort's projects", projects?.some((p) => p.student_id === studentId));
  const { data: scholarships } = await college.supabase.from("scholarship_applications").select("id");
  check("the college cannot see scholarship applications", (scholarships ?? []).length === 0);
  const { data: payments } = await college.supabase.from("payments").select("id");
  check("the college cannot see payments", (payments ?? []).length === 0);
}

console.log(failures === 0 ? "\nCAREER CHECKS PASSED" : `\n${failures} CAREER CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
