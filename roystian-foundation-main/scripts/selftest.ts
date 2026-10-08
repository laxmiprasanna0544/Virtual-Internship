/* Temporary verification harness for the demo's pure logic. */
import { DOMAINS, ASSESSMENTS, getFinalAssessment, getDomain } from "../data/domains";
import { buildSeedDatabase } from "../data/seed";
import { scoreAssessment, summariseProgress, completionRequirements, isCertificateUnlocked } from "../lib/progress";
import { computeKpis, registrationsOverTime, domainBreakdown, programSplit } from "../lib/analytics";
import { buildSchedule } from "../lib/schedule";
import { buildRecommendation } from "../lib/recommendation";
import { buildRegistrationId } from "../lib/ids";
import { computeReadiness, READINESS_WEIGHTS, readinessBand } from "../lib/readiness";
import { badgeStates } from "../lib/badges";
import { evaluateInterview } from "../lib/interviews";
import { PROJECTS, projectsForDomain, isProjectUnlocked } from "../data/projects";
import { CHALLENGES, challengesForDomain } from "../data/challenges";
import { BADGES } from "../data/badges";
import { fellowshipEligibility } from "../lib/opportunities";
import { CLUSTERS } from "../data/career-pathways";
import { cohortFor, campusMetrics, skillGapReport } from "../lib/campus";

let failures = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL  ${name}`, extra ?? "");
  } else {
    console.log(`ok    ${name}`);
  }
}

// ── Curriculum ──────────────────────────────────────────────
check("12 domains", DOMAINS.length === 12, DOMAINS.length);
check("every domain has 10 modules", DOMAINS.every((d) => d.modules.length === 10));
check(
  "every module has 4+ assessment questions",
  ASSESSMENTS.filter((a) => a.kind === "module").every((a) => a.questions.length >= 4),
);
check(
  "final assessments have 10 questions",
  DOMAINS.every((d) => getFinalAssessment(d.id)?.questions.length === 10),
);
check(
  "every question has exactly one distinct correct set and 4 options",
  ASSESSMENTS.every((a) =>
    a.questions.every(
      (q) =>
        q.options.length === 4 &&
        q.correct.length >= 1 &&
        new Set(q.options).size === 4 &&
        q.correct.every((i) => i >= 0 && i < q.options.length),
    ),
  ),
);
check(
  "single-choice questions have one answer",
  ASSESSMENTS.every((a) =>
    a.questions.filter((q) => q.type === "single").every((q) => q.correct.length === 1),
  ),
);
check(
  "multi-choice questions have two answers",
  ASSESSMENTS.every((a) =>
    a.questions.filter((q) => q.type === "multiple").every((q) => q.correct.length === 2),
  ),
);
check("domain codes unique", new Set(DOMAINS.map((d) => d.code)).size === 12);

// ── Scoring ─────────────────────────────────────────────────
const sample = ASSESSMENTS.find((a) => a.kind === "module")!;
const perfect: Record<string, number[]> = {};
for (const q of sample.questions) perfect[q.id] = q.correct;
const perfectAttempt = scoreAssessment(sample, perfect);
check("perfect score is 100%", perfectAttempt.percentage === 100 && perfectAttempt.passed);

const empty = scoreAssessment(sample, {});
check("empty submission scores 0 and fails", empty.percentage === 0 && !empty.passed);

const partial: Record<string, number[]> = {};
sample.questions.forEach((q, i) => {
  partial[q.id] = i < 3 ? q.correct : [];
});
const partialAttempt = scoreAssessment(sample, partial);
check(
  "3/5 correct = 60% and fails the 70% threshold",
  partialAttempt.score === 3 && partialAttempt.percentage === 60 && !partialAttempt.passed,
  partialAttempt,
);

const multi = sample.questions.find((q) => q.type === "multiple");
if (multi) {
  const onlyOne: Record<string, number[]> = { [multi.id]: [multi.correct[0]] };
  const res = scoreAssessment(sample, onlyOne);
  check("partial multi-select answer is not credited", res.score === 0, res);
}

// ── Seed data ───────────────────────────────────────────────
const db = buildSeedDatabase();
check("seed has 24 students", db.students.length === 24, db.students.length);
check(
  "demo student is Rahul Sharma at 4/10 modules",
  db.students[0].email === "student@roystian.demo" &&
    db.progress[0].completedModules.length === 4,
  db.progress[0].completedModules.length,
);
check(
  "documented certificate IDs exist",
  ["RF-AIML-2026-000184", "RF-DA-2026-001284", "RF-FS-2026-001101"].every((id) =>
    db.certificates.some((c) => c.id === id),
  ),
  db.certificates.map((c) => c.id),
);
check(
  "registration ids are unique",
  new Set(db.registrations.map((r) => r.id)).size === db.registrations.length,
);
check(
  "certificate ids are unique",
  new Set(db.certificates.map((c) => c.id)).size === db.certificates.length,
);
check(
  "every registration has a payment",
  db.registrations.every((r) => db.payments.some((p) => p.registrationId === r.id)),
);
check(
  "every student has a progress record",
  db.students.every((s) => db.progress.some((p) => p.studentId === s.id)),
);
check("id format", buildRegistrationId("ai-ml", 184, 2026) === "RF-AIML-2026-000184");

// ── Completion rules ────────────────────────────────────────
const demo = db.students[0];
const demoProgress = db.progress[0];
const demoSubmission = db.submissions.find((s) => s.studentId === demo.id)!;
const demoSummary = summariseProgress(demo, demoProgress, demoSubmission);
check("demo student module percent is 40%", demoSummary.modulePercent === 40, demoSummary);
check(
  "demo student certificate is locked",
  !isCertificateUnlocked(demo, demoProgress, demoSubmission),
);
check(
  "locked student has unmet requirements",
  completionRequirements(demo, demoProgress, demoSubmission).some((r) => !r.done),
);

const finished = db.students.find((s) => s.name === "Ananya Singh")!;
const finishedProgress = db.progress.find((p) => p.studentId === finished.id)!;
const finishedSubmission = db.submissions.find((s) => s.studentId === finished.id)!;
check(
  "completed student meets every requirement",
  isCertificateUnlocked(finished, finishedProgress, finishedSubmission),
  completionRequirements(finished, finishedProgress, finishedSubmission).filter((r) => !r.done),
);

// A paid-but-untouched student must never be certificate-eligible.
const fresh = {
  ...demo,
  id: "stu_fresh",
};
check(
  "payment alone does not unlock the certificate",
  !isCertificateUnlocked(fresh, null, null),
);

// ── Analytics ───────────────────────────────────────────────
const kpis = computeKpis(db);
check("kpi revenue matches payments", kpis.revenue === db.payments.reduce((s, p) => s + p.amount, 0));
check(
  "program split totals registrations",
  programSplit(db).reduce((s, p) => s + p.value, 0) === db.registrations.length,
);
check("timeline has 8 buckets", registrationsOverTime(db).length === 8);
check("domain breakdown is non-empty", domainBreakdown(db).length > 0);
check(
  "completion rate between 0 and 100",
  kpis.completionRate >= 0 && kpis.completionRate <= 100,
);

// ── Schedule ────────────────────────────────────────────────
const schedule = buildSchedule("ai-ml", new Date().toISOString());
check("schedule is 15 days", schedule.length === 15, schedule.length);
check("day 15 is the final evaluation", schedule[14].topic.includes("Final Evaluation"));
check("empty schedule without a start date", buildSchedule("ai-ml", null).length === 0);

// ── Recommendation ──────────────────────────────────────────
const rec = buildRecommendation("ai-ml", "beginner", "undergraduate");
check(
  "recommendation built for AI/ML beginner",
  rec?.trackName === "AI / ML Beginner Track" && rec.moduleCount === 10,
  rec?.trackName,
);
check("no recommendation without experience", buildRecommendation("ai-ml", null, "undergraduate") === null);
check("domain lookup by id", getDomain("sustainability")?.code === "SUS");

// ── V2: clusters & domain questions ─────────────────────────
check(
  "every domain belongs to one of the three clusters",
  DOMAINS.every((d) => CLUSTERS.includes(d.cluster)),
);
check(
  "every cluster has at least one domain",
  CLUSTERS.every((c) => DOMAINS.some((d) => d.cluster === c)),
);
check(
  "every domain answers the practise and pathway questions",
  DOMAINS.every((d) => d.whatYouPractise.length > 0 && d.careerPathways.length > 0),
);

// ── V2: projects ────────────────────────────────────────────
check("every domain has a core and an advanced brief", DOMAINS.every((d) => {
  const briefs = projectsForDomain(d.id);
  return (
    briefs.length === 2 &&
    briefs.some((b) => b.tier === "core") &&
    briefs.some((b) => b.tier === "advanced")
  );
}));
check(
  "project criteria weights sum to 100",
  PROJECTS.every(
    (p) => p.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0) === 100,
  ),
);
check("project ids are unique", new Set(PROJECTS.map((p) => p.id)).size === PROJECTS.length);
check(
  "advanced briefs are Industry-Led only",
  PROJECTS.filter((p) => p.tier === "advanced").every(
    (p) => !isProjectUnlocked(p, "self-paced") && isProjectUnlocked(p, "industry-led"),
  ),
);
check(
  "core briefs are open to both programmes",
  PROJECTS.filter((p) => p.tier === "core").every(
    (p) => isProjectUnlocked(p, "self-paced") && isProjectUnlocked(p, "industry-led"),
  ),
);

// ── V2: challenges ──────────────────────────────────────────
check("six industry challenges", CHALLENGES.length === 6, CHALLENGES.length);
check(
  "challenge recommendations never overlap the remainder",
  DOMAINS.every((d) => {
    const { recommended, others } = challengesForDomain(d.id);
    const ids = new Set(recommended.map((c) => c.id));
    return (
      others.every((c) => !ids.has(c.id)) &&
      recommended.length + others.length === CHALLENGES.length
    );
  }),
);

// ── V2: readiness ───────────────────────────────────────────
const weightSum = Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0);
check("readiness weights sum to 1", Math.abs(weightSum - 1) < 1e-9, weightSum);

const blankReadiness = computeReadiness({
  student: null,
  progress: null,
  submission: null,
  projects: [],
  interviews: [],
  challenges: [],
});
check("a student with no evidence scores 0", blankReadiness.score === 0, blankReadiness.score);
check("no evidence means zero coverage", blankReadiness.evidenceCoverage === 0);
check("readiness always reports five areas", blankReadiness.breakdown.length === 5);
check("no strengths without evidence", blankReadiness.strengths.length === 0);

const seedStudent = db.students.find((s) => s.id === "stu_001")!;
const seedProgress =
  db.progress.find(
    (p) => p.studentId === seedStudent.id && p.domainId === seedStudent.domainId,
  ) ?? null;
const seedReadiness = computeReadiness({
  student: seedStudent,
  progress: seedProgress,
  submission: db.submissions.find((s) => s.studentId === seedStudent.id) ?? null,
  projects: db.projectSubmissions.filter((p) => p.studentId === seedStudent.id),
  interviews: db.interviews.filter((s) => s.studentId === seedStudent.id),
  challenges: db.challengeEntries.filter((c) => c.studentId === seedStudent.id),
});
check(
  "a seeded student scores within range",
  seedReadiness.score >= 0 && seedReadiness.score <= 100,
  seedReadiness.score,
);
check(
  "every readiness area stays within range",
  seedReadiness.breakdown.every((b) => b.score >= 0 && b.score <= 100),
);
check(
  "every readiness area explains its basis",
  seedReadiness.breakdown.every((b) => b.basis.length > 0),
);
check("readiness bands cover the whole range",
  ["0", "40", "65", "85"].every((v) => readinessBand(Number(v)).label.length > 0));

// ── V2: badges ──────────────────────────────────────────────
const blankBadges = badgeStates({
  student: null,
  progress: null,
  submission: null,
  projects: [],
  challenges: [],
  readiness: blankReadiness,
});
check("badge catalogue is fully listed even when unearned", blankBadges.length === BADGES.length);
check("no badge is earned without evidence", blankBadges.every((b) => !b.earned));
check("unearned badges still publish their criteria", blankBadges.every((b) => b.criteria.length > 0));

const seedBadges = badgeStates({
  student: seedStudent,
  progress: seedProgress,
  submission: db.submissions.find((s) => s.studentId === seedStudent.id) ?? null,
  projects: db.projectSubmissions.filter((p) => p.studentId === seedStudent.id),
  challenges: db.challengeEntries.filter((c) => c.studentId === seedStudent.id),
  readiness: seedReadiness,
});
check(
  "every earned badge carries its evidence",
  seedBadges.filter((b) => b.earned).every((b) => Boolean(b.evidence)),
);

// ── V2: interviews ──────────────────────────────────────────
const emptyInterview = evaluateInterview("hr", "AI / ML", {});
check("an unanswered interview scores 0", emptyInterview.overallScore === 0);
check(
  "an unanswered interview flags the skipped questions",
  emptyInterview.improvements.some((i) => i.includes("unanswered")),
);

const goodAnswer =
  "First, I was asked to reduce a reporting job that took six hours every Monday. " +
  "The problem was that three source files arrived in different formats, so I built a validation step " +
  "that rejected malformed rows instead of silently dropping them. Then I automated the transformation " +
  "and added unit tests around the edge cases. The result was that the job runs in four minutes and " +
  "has caught two upstream data errors since. I would measure the failure rate before optimising further.";
const strongInterview = evaluateInterview("hr", "AI / ML", {
  "hr-1": goodAnswer,
  "hr-2": goodAnswer,
  "hr-3": goodAnswer,
  "hr-4": goodAnswer,
  "hr-5": goodAnswer,
});
check(
  "a structured, specific answer outscores an empty one",
  strongInterview.overallScore > emptyInterview.overallScore,
  strongInterview.overallScore,
);
check(
  "interview scores stay within range",
  strongInterview.overallScore >= 0 && strongInterview.overallScore <= 100,
);

// ── V2: fellowship gating ───────────────────────────────────
const blockedFellowship = fellowshipEligibility({
  student: null,
  certificateIssued: false,
  assessmentsPassed: 0,
  assessmentTotal: 10,
  submission: null,
  projects: [],
  challenges: [],
  readiness: blankReadiness,
});
check("fellowship is closed with no evidence", !blockedFellowship.eligible);
check("fellowship states all five gates", blockedFellowship.criteria.length === 5);
check("no gate is met with no evidence", blockedFellowship.metCount === 0);

// ── V2: college campus ──────────────────────────────────────
check("demo colleges are seeded", db.colleges.length === 3, db.colleges.length);
check(
  "every seeded college has a matching cohort",
  db.colleges.every((c) => cohortFor(db, c).length > 0),
  db.colleges.map((c) => `${c.name}:${cohortFor(db, c).length}`).join(" | "),
);
check(
  "the college login account resolves to a college record",
  db.colleges.some((c) => c.id === "college_vjit"),
);

for (const college of db.colleges) {
  const cohort = cohortFor(db, college);
  const metrics = campusMetrics(db, cohort);
  const report = skillGapReport(db, college, cohort);

  check(
    `${college.name}: metrics are internally consistent`,
    metrics.enrolled === cohort.length &&
      metrics.active + metrics.completed <= metrics.enrolled &&
      metrics.avgAssessment >= 0 &&
      metrics.avgAssessment <= 100 &&
      metrics.careerReady <= metrics.enrolled,
    JSON.stringify(metrics),
  );

  // The bug this guards against: with only five measured areas, a naive
  // top-3 / bottom-3 split lists the same skill as both a strength and a gap.
  const strengthNames = new Set(report.strengths.map((s) => s.skill));
  const overlap = report.gaps.filter((g) => strengthNames.has(g.skill));
  check(
    `${college.name}: strengths and gaps never overlap`,
    overlap.length === 0,
    overlap.map((o) => o.skill).join(", "),
  );

  check(
    `${college.name}: every gap maps to an intervention`,
    report.recommendedInterventions.length === report.gaps.length,
  );
  check(
    `${college.name}: signals only count students with evidence`,
    [...report.strengths, ...report.gaps].every(
      (s) => s.studentCount > 0 && s.studentCount <= cohort.length,
    ),
  );
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
