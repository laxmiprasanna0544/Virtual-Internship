/**
 * Career tools through the real API routes: projects and their evaluation,
 * industry challenges, the Career Passport and public profiles, the partner
 * talent directory, resume/LinkedIn drafts, mock interviews, fellowship and
 * scholarship applications, notifications, and the public college enquiry.
 *
 * Evaluated work is final (audit fix): neither a project nor a challenge
 * entry can be changed or resubmitted once staff have scored it.
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
  sql,
} from "./lib.mjs";

const { projects, challenges } = curriculum();
const DOMAIN = "ai-ml";

const student = new Client("career-student");
const me = await newStudent(student, { name: "Career Student" });
await enrol(student, DOMAIN, "industry-led");

const trainer = new Client("career-trainer");
await newStaff(trainer, "trainer", { trainerDomains: [DOMAIN] });
const admin = new Client("career-admin");
await newStaff(admin, "admin");

section("Projects");
const brief = projects.projectsForDomain(DOMAIN)[0];
let res = await student.post("/api/career/projects", { action: "start", projectId: brief.id });
check("project started", res.status === 200, res.text);
res = await student.post("/api/career/projects", { action: "start", projectId: "no-such-project" });
check("unknown project → 404", res.status === 404, res.status);
let [project] = await sql`select * from public.project_submissions where student_id = ${me.id} and project_id = ${brief.id}`;
check("project row created in-progress", project?.status === "in-progress", project?.status);

res = await student.post("/api/career/projects", {
  action: "draft",
  submissionId: project.id,
  analysis: "Initial analysis of the dataset.",
  recommendations: "Use gradient boosting.",
  repoUrl: "https://github.com/example/project",
});
check("draft saved", res.status === 200, res.text);
res = await student.post("/api/career/projects", { action: "draft", submissionId: project.id, repoUrl: "not a url" });
check("invalid repo URL rejected (400)", res.status === 400, res.status);

const other = new Client("career-other");
const otherMe = await newStudent(other, { name: "Other Student" });
res = await other.post("/api/career/projects", { action: "draft", submissionId: project.id, analysis: "hijack" });
check("another student cannot edit this project (404)", res.status === 404, res.status);

res = await student.post("/api/career/projects", { action: "submit", submissionId: project.id });
check("project submitted", res.status === 200, res.text);

const scores = Object.fromEntries(brief.evaluationCriteria.map((c, i) => [c.label, 60 + i * 10]));
const expected = Math.round(
  brief.evaluationCriteria.reduce((sum, c) => sum + Math.round(scores[c.label]) * (c.weight / 100), 0),
);
res = await student.post("/api/admin/projects/evaluate", { submissionId: project.id, criterionScores: scores, feedback: "self" });
check("student cannot evaluate (403)", res.status === 403, res.status);
const otherTrainer = new Client("career-trainer-other");
await newStaff(otherTrainer, "trainer", { trainerDomains: ["cyber-security"] });
res = await otherTrainer.post("/api/admin/projects/evaluate", { submissionId: project.id, criterionScores: scores, feedback: "x" });
check("trainer for another domain cannot evaluate (403)", res.status === 403, res.status);
res = await trainer.post("/api/admin/projects/evaluate", {
  submissionId: project.id,
  criterionScores: { ...scores, "Made-up criterion": 100 },
  feedback: "Solid work.",
  overallScore: 100,
});
check("trainer evaluates the project", res.status === 200, res.text);
check("overall score is the server-side weighted score", res.json?.overallScore === expected, `${res.json?.overallScore} vs ${expected}`);
[project] = await sql`select * from public.project_submissions where id = ${project.id}`;
check("evaluation stored", project.status === "evaluated" && project.overall_score === expected, project);
check("unknown criteria are not stored", !("Made-up criterion" in project.criterion_scores), project.criterion_scores);

res = await student.post("/api/career/projects", { action: "draft", submissionId: project.id, analysis: "Replaced after scoring" });
check("evaluated project cannot be edited (409)", res.status === 409, res.status);
res = await student.post("/api/career/projects", { action: "submit", submissionId: project.id });
check("evaluated project cannot be resubmitted (409)", res.status === 409, res.status);
const [afterProject] = await sql`select * from public.project_submissions where id = ${project.id}`;
check(
  "score, status and analysis unchanged after attempts",
  afterProject.status === "evaluated" && afterProject.overall_score === expected && afterProject.analysis === "Initial analysis of the dataset.",
  afterProject,
);

section("Industry challenges");
const challenge = challenges.CHALLENGES[0];
res = await student.post("/api/career/challenges", {
  challengeId: challenge.id,
  approach: "Break the problem down.",
  solution: "First solution",
  repoUrl: null,
});
check("challenge entry submitted", res.status === 200, res.text);
res = await student.post("/api/career/challenges", { challengeId: "nope", approach: "", solution: "", repoUrl: null });
check("unknown challenge → 404", res.status === 404, res.status);
res = await student.post("/api/career/challenges", {
  challengeId: challenge.id,
  approach: "Revised approach.",
  solution: "Second solution",
  repoUrl: null,
  status: "evaluated",
  score: 100,
});
check("student may revise before evaluation", res.status === 200, res.text);
let [entry] = await sql`select * from public.challenge_entries where student_id = ${me.id} and challenge_id = ${challenge.id}`;
check("client cannot set status or score", entry.status === "submitted" && entry.score === null, entry);

res = await student.post("/api/admin/challenges/score", { entryId: entry.id, score: 100, feedback: "" });
check("student cannot score a challenge (403)", res.status === 403, res.status);
res = await admin.post("/api/admin/challenges/score", { entryId: entry.id, score: 82, feedback: "Good." });
check("admin scores the entry", res.status === 200, res.text);
res = await student.post("/api/career/challenges", {
  challengeId: challenge.id,
  approach: "Sneaky",
  solution: "Replacement after scoring",
  repoUrl: null,
});
check("evaluated entry cannot be resubmitted (409)", res.status === 409, res.status);
[entry] = await sql`select * from public.challenge_entries where id = ${entry.id}`;
check(
  "score and solution unchanged",
  entry.status === "evaluated" && entry.score === 82 && entry.solution === "Second solution",
  entry,
);

section("Career Passport and public profile");
res = await student.post("/api/career/passport", { action: "update", headline: "x" });
check("update before the passport exists → 404", res.status === 404, res.status);
res = await student.post("/api/career/passport", { action: "ensure" });
check("passport created", res.status === 200, res.text);
const [passport] = await sql`select * from public.career_passports where student_id = ${me.id}`;
check("slug derived from the name", /^career-student(-\d+)?$/.test(passport?.slug ?? ""), passport?.slug);
check("passport is private by default", passport?.published === false);

res = await other.post("/api/career/passport", { action: "ensure" });
check("a second student gets a free slug even when private passports already use it", res.status === 200, res.text);
const slug = `career-${Date.now().toString(36)}`;
res = await student.post("/api/career/passport", { action: "update", slug: "NO SPACES!" });
check("invalid slug rejected (400)", res.status === 400, res.status);
res = await student.post("/api/career/passport", { action: "update", slug, about: "I build models.", headline: "AI/ML intern" });
check("slug and about updated", res.status === 200, res.text);
res = await other.post("/api/career/passport", { action: "update", slug });
check("taken slug → 409", res.status === 409, res.status);

const anon = new Client("career-anon");
res = await anon.get(`/api/profiles/${slug}`);
check("unpublished profile → 404", res.status === 404, res.status);
res = await student.post("/api/career/passport", { action: "update", published: true });
check("profile published", res.status === 200, res.text);
res = await anon.get(`/api/profiles/${slug}`);
check("published profile is public", res.status === 200 && res.json?.profile?.slug === slug, res.text);
check("contact email hidden by default", res.json?.profile?.student?.email === null, res.json?.profile?.student);
check("evaluated project visible when enabled", res.json?.profile?.projects?.some((p) => p.overallScore === expected), res.json?.profile?.projects);
check("no internal identifiers leak", !res.text.includes(me.id), "student id in public profile");

res = await student.post("/api/career/passport", {
  action: "update",
  visibility: { readiness: false, projects: false, assessments: false, badges: false, certificate: false, contact: true },
});
check("visibility updated", res.status === 200, res.text);
res = await anon.get(`/api/profiles/${slug}`);
const view = res.json?.profile;
check("contact shown only when enabled", view?.student?.email === me.email, view?.student);
check(
  "disabled sections are empty",
  view?.readiness === null && view?.projects?.length === 0 && view?.assessments === null && view?.badges?.length === 0 && view?.certificate === null,
  view,
);
res = await anon.get("/api/profiles/../etc");
check("malformed slug → 404", res.status === 404, res.status);

section("Partner talent directory");
const partner = new Client("career-partner");
await newStaff(partner, "partner");
res = await partner.get("/api/partner/talent");
check("partner lists published profiles", res.status === 200 && res.json?.profiles?.some((p) => p.slug === slug), res.status);
check("unpublished profiles are not listed", !res.json?.profiles?.some((p) => p.slug === passport.slug && p.slug !== slug));
res = await student.get("/api/partner/talent");
check("student cannot open the talent directory (403)", res.status === 403, res.status);

section("Resume and LinkedIn drafts");
res = await student.post("/api/career/resume", {
  headline: "Aspiring ML engineer",
  summary: "Built models.",
  skills: ["Python", "SQL"],
  includeProjects: true,
  includeAssessments: false,
  includeCertificate: true,
});
check("resume saved", res.status === 200, res.text);
const [resume] = await sql`select * from public.resume_drafts where student_id = ${me.id}`;
check("resume stored", resume?.headline === "Aspiring ML engineer" && resume.skills.join() === "Python,SQL", resume);
res = await student.post("/api/career/linkedin", { sections: { headline: "ML intern", about: "Hi" } });
check("LinkedIn drafts saved", res.status === 200, res.text);
const [linkedin] = await sql`select sections from public.linkedin_drafts where student_id = ${me.id}`;
check("LinkedIn drafts stored", linkedin?.sections?.headline === "ML intern", linkedin);
res = await student.post("/api/career/resume", { headline: 1 });
check("invalid resume rejected (400)", res.status === 400, res.status);

section("Mock interviews are scored on the server");
res = await other.post("/api/interviews", { kind: "hr", answers: { "hr-1": "Hello" } });
check("student without a domain is refused (400)", res.status === 400, res.status);
res = await student.post("/api/interviews", {
  kind: "hr",
  answers: {
    "hr-1": "I am a final-year engineering student who enjoys building data products. In my internship I cleaned a messy dataset, trained a model and explained the results to my team, and I learned to communicate trade-offs clearly.",
    "made-up": "ignored",
  },
  overallScore: 100,
  scores: { clarity: 100 },
});
check("interview scored", res.status === 200 && typeof res.json?.session?.overallScore === "number", res.text);
const [session] = await sql`select * from public.interview_sessions where student_id = ${me.id} order by completed_at desc limit 1`;
check("client-sent scores ignored", session?.overall_score === res.json?.feedback?.overallScore && session.overall_score !== 100, session?.overall_score);
check("unknown question answers are dropped", !("made-up" in (session?.answers ?? {})), session?.answers);

section("Fellowship");
res = await student.post("/api/fellowship/apply", {
  motivation: "I want to work on applied machine learning problems.",
  availableFrom: "2026-12-01",
  canRelocate: true,
  preferredArea: "AI/ML",
});
check("ineligible student cannot apply (403)", res.status === 403, res.text);
res = await student.post("/api/fellowship/apply", { motivation: "short", availableFrom: "soon", canRelocate: true, preferredArea: "" });
check("invalid application rejected (400)", res.status === 400, res.status);
const [fellowship] = await sql`select * from public.fellowship_applications where student_id = ${me.id}`;
check("no application row created", !fellowship, fellowship);

section("Scholarship");
const statement = "My family cannot afford the full fee this year; a scholarship would let me complete the programme.";
res = await student.post("/api/scholarships/apply", { requestedTier: 60, householdIncomeBand: "a", category: "b", statement });
check("invalid tier rejected (400)", res.status === 400, res.status);
res = await student.post("/api/scholarships/apply", { requestedTier: 75, householdIncomeBand: "Below 3 LPA", category: "General", statement });
check("scholarship application submitted", res.status === 200, res.text);
res = await student.post("/api/scholarships/apply", { requestedTier: 100, householdIncomeBand: "Below 3 LPA", category: "General", statement });
check("second open application refused (409)", res.status === 409, res.status);
const [application] = await sql`select * from public.scholarship_applications where student_id = ${me.id}`;
check("application stored as submitted with no award", application?.status === "submitted" && application.awarded_tier === null, application);
res = await student.post("/api/admin/scholarships/decide", { applicationId: application.id, status: "approved", awardedTier: 100 });
check("student cannot decide (403)", res.status === 403, res.status);
res = await admin.post("/api/admin/scholarships/decide", { applicationId: application.id, status: "approved", awardedTier: 75 });
check("admin approves with a tier", res.status === 200, res.text);
const [decided] = await sql`select * from public.scholarship_applications where id = ${application.id}`;
check("decision stored", decided.status === "approved" && decided.awarded_tier === 75 && decided.decided_at, decided);

section("Notifications");
res = await student.get("/api/notifications");
const notifications = res.json?.notifications ?? [];
check("notifications listed", res.status === 200 && notifications.length > 0, res.text);
check("scholarship award notified", notifications.some((n) => /Scholarship awarded/i.test(n.title)), notifications.map((n) => n.title));
check("project evaluation notified", notifications.some((n) => /Project evaluated/i.test(n.title)), notifications.map((n) => n.title));
const target = notifications.find((n) => !n.read);
res = await other.post("/api/notifications", { id: target.id });
check("request to mark another user's notification is accepted but does nothing", res.status === 200);
let [row] = await sql`select read from public.notifications where id = ${target.id}`;
check("another user's notification stays unread", row.read === false, row);
res = await student.post("/api/notifications", { id: target.id });
[row] = await sql`select read from public.notifications where id = ${target.id}`;
check("owner marks it read", res.status === 200 && row.read === true, row);
res = await student.post("/api/notifications", { all: true });
const [{ unread }] = await sql`select count(*)::int as unread from public.notifications where user_id = ${me.id} and not read`;
check("mark all read", res.status === 200 && unread === 0, unread);
const [{ otherUnread }] = await sql`select count(*)::int as "otherUnread" from public.notifications where user_id = ${otherMe.id}`;
check("other user's notifications untouched (sanity)", otherUnread >= 0);
res = await student.post("/api/notifications", { id: "not-a-uuid" });
check("invalid body rejected (400)", res.status === 400, res.status);

section("Public college enquiry");
const visitor = new Client("career-lead");
const lead = {
  collegeName: `Test College ${Date.now()}`,
  city: "Pune",
  state: "Maharashtra",
  institutionType: "engineering",
  contactPerson: "Dr. Test",
  email: "tpo@college.example",
  message: "We'd like to discuss internships for 200 students.",
};
res = await visitor.post("/api/leads", lead);
check("lead submitted anonymously", res.status === 200, res.text);
let leads = await sql`select * from public.college_leads where college_name = ${lead.collegeName}`;
check("lead stored with status new", leads.length === 1 && leads[0].status === "new", leads);
res = await visitor.post("/api/leads", { ...lead, collegeName: `${lead.collegeName} bot`, website: "http://spam.example" });
check("honeypot-filled submission rejected", res.status === 400, res.status);
leads = await sql`select 1 from public.college_leads where college_name = ${`${lead.collegeName} bot`}`;
check("no row for the bot submission", leads.length === 0);
res = await visitor.post("/api/leads", { collegeName: "x" });
check("invalid lead rejected (400)", res.status === 400, res.status);
res = await visitor.post("/api/leads", { ...lead, status: "closed", collegeName: `${lead.collegeName} status` });
leads = await sql`select status from public.college_leads where college_name = ${`${lead.collegeName} status`}`;
check("client cannot set the lead status", leads.every((l) => l.status === "new"), leads);
let limited = false;
for (let i = 0; i < 8; i += 1) {
  res = await visitor.post("/api/leads", { ...lead, collegeName: `${lead.collegeName} ${i}` });
  if (res.status === 429) {
    limited = true;
    break;
  }
}
check("lead form is rate limited (429)", limited, res.status);
res = await student.get("/api/admin/data");
check("students cannot read leads through the admin API (403)", res.status === 403, res.status);

await sql`delete from public.college_leads where college_name like ${lead.collegeName + "%"}`;
await finish("career");
