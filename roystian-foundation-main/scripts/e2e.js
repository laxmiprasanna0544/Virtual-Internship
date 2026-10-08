/**
 * End-to-end smoke test of the Roystian Foundation site in a real browser.
 *
 * Server-side 200s prove nothing about the V2 pages, because almost all of
 * them are client components that read the demo database out of localStorage.
 * This drives an actual Chromium instance through the real journeys and fails
 * on any console error, page error, or missing expected content.
 *
 * Usage:
 *   npm run dev -- --port 3002        # in one terminal
 *   npm i -D playwright && npx playwright install chromium
 *   npm run test:e2e                  # or BASE=http://localhost:3000 npm run test:e2e
 *
 * Playwright is intentionally not a project dependency — this harness is
 * opt-in so a normal install stays lean.
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3002";

const results = [];
let consoleErrors = [];
let pageErrors = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? "ok   " : "FAIL ";
  console.log(`${tag} ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

/** Visit a path and assert every needle appears in the rendered body text. */
async function visit(page, path, needles = [], opts = {}) {
  consoleErrors = [];
  pageErrors = [];

  const res = await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const status = res ? res.status() : 0;
  if (status !== 200) {
    record(`${path} responds 200`, false, `got ${status}`);
    return null;
  }

  // Client components hydrate and then read localStorage; give them a beat.
  await page.waitForTimeout(opts.settle ?? 1400);

  // Sections below the fold are wrapped in scroll-reveal wrappers, so their
  // content is not in the DOM until they enter the viewport. Walk the page.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 150));
  });

  const text = (
    await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll("script,style").forEach((n) => n.remove());
      return clone.textContent || "";
    })
  )
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ");

  const missing = needles.filter(
    (n) => !text.toLowerCase().includes(n.toLowerCase()),
  );
  record(
    `${path} renders expected content`,
    missing.length === 0,
    missing.length ? `missing: ${missing.join(" | ")}` : "",
  );

  if (pageErrors.length) {
    record(`${path} has no uncaught exceptions`, false, pageErrors.join(" ; "));
  }
  if (consoleErrors.length) {
    record(`${path} has no console errors`, false, consoleErrors.join(" ; "));
  }

  return text;
}

/**
 * Signs in through the real login form.
 *
 * Waits for the URL to actually leave /login rather than sleeping a fixed
 * interval — on a cold dev server the destination route still has to compile,
 * which can take several seconds and would otherwise read as a failed login.
 */
async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(600);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30000,
    });
  } catch {
    // Fall through; the caller records the URL and fails the check.
  }
  await page.waitForTimeout(800);
  return page.url();
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  let page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Next dev serves source maps and favicons that 404 harmlessly.
      if (/favicon|sourcemap|Download the React DevTools/i.test(t)) return;
      consoleErrors.push(t);
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  /**
   * Swap in a brand-new browser context so each role starts from a genuinely
   * clean session. Clearing localStorage on an already-guarded page races the
   * guard's redirect and produces false failures.
   */
  let currentContext = context;
  async function context2Swap(label) {
    const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fpage = await fresh.newPage();
    fpage.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text();
        if (/favicon|sourcemap|Download the React DevTools/i.test(t)) return;
        consoleErrors.push(t);
      }
    });
    fpage.on("pageerror", (err) => pageErrors.push(err.message));
    await currentContext.close();
    currentContext = fresh;
    page = fpage;
    console.log(`   (fresh session for ${label})`);
  }

  /* ─────────────── 1. Public marketing site ─────────────── */
  console.log("\n── Public site ──────────────────────────────────");

  await visit(page, "/", [
    "Build career evidence",
    "Learn. Build. Prove. Get Opportunity.",
    "A Degree Is Important",
    "Career Passport",
    "How career ready are you",
    "Perform. Get selected",
    "Built for transparency",
    "Your degree opens the door",
  ]);

  await visit(page, "/internships", [
    "Career Starter",
    "Industry Sprint",
    "Technology",
    "Data & Business",
    "Emerging & Engineering",
    "What will I learn?",
    "What career pathways",
  ]);

  await visit(page, "/internships/ai-ml", [
    "What you will learn",
    "What you will practise",
    "Career pathways these skills support",
    "Machine Learning Engineer",
  ]);

  await visit(page, "/for-students", [
    "Career Passport",
    "Real-World Projects",
    "Resume Builder",
    "LinkedIn Profile Builder",
    "Mock Interview Centre",
    "Skill Badges",
  ]);

  await visit(page, "/opportunities", [
    "Industry Challenges",
    "Roystian Talent Fellowship",
    "Advanced Internship Pathway",
    "Skill Scholarship",
  ]);

  await visit(page, "/opportunities/challenges", [
    "AI Challenge",
    "Coding Challenge",
    "Data Challenge",
    "Software Testing Challenge",
    "Business Case Challenge",
    "Sustainability Challenge",
  ]);

  await visit(page, "/opportunities/fellowship", [
    "3-Month Paid Internship",
    "Mentorship",
    "Four gates open the application",
  ]);

  await visit(page, "/opportunities/advanced-internship", [
    "Roystian Technology Ecosystem",
    "Hyderabad",
    "not a third-party-certified",
  ]);

  await visit(page, "/opportunities/scholarship", [
    "100% Support",
    "75% Support",
    "50% Support",
  ]);

  await visit(page, "/colleges", [
    "Roystian Campus Dashboard",
    "skill gap report",
    "Partner With Roystian",
  ]);

  await visit(page, "/domains", ["Career"]);
  await visit(page, "/programs", ["Self-Paced", "Industry-Led"]);
  await visit(page, "/about", ["Section 8"]);
  await visit(page, "/verify", ["Verify"]);

  /* ─────────────── 2. Navigation dropdowns ─────────────── */
  console.log("\n── Navigation ───────────────────────────────────");

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Hover the "For Students" group and confirm its panel opens.
  const groupLink = page.locator('nav[aria-label="Primary navigation"] a', {
    hasText: "For Students",
  });
  const groupCount = await groupLink.count();
  record("primary nav renders grouped items", groupCount > 0, `found ${groupCount}`);

  if (groupCount > 0) {
    await groupLink.first().hover();
    await page.waitForTimeout(500);
    const panelText = await page.evaluate(() => document.body.innerText);
    const opened =
      panelText.includes("Career Readiness") &&
      panelText.includes("Mock Interviews");
    record("nav dropdown opens on hover", opened);
  }

  /* ─────────────── 3. Student journey ─────────────── */
  console.log("\n── Student dashboard ────────────────────────────");

  const dest = await login(page, "student@roystian.demo", "student123");
  record("student login lands on dashboard", dest.includes("/dashboard"), dest);

  await visit(page, "/dashboard", [
    "Career evidence",
    "Career Readiness",
    "Skill Badges",
    "Projects",
  ]);

  const readinessText = await visit(page, "/dashboard/readiness", [
    "Career Readiness",
    "Technical Skills",
    "Practical Application",
    "Problem Solving",
    "Communication",
    "Project Execution",
    "How this is calculated",
    "not a guarantee of employment",
  ]);

  {
    // Read the headline figure from its own node — concatenated body text
    // glues adjacent numbers together.
    const score = await page.evaluate(() => {
      const el = [...document.querySelectorAll("p")].find((n) =>
        /\/\s*100\s*$/.test((n.innerText || "").trim()),
      );
      if (!el) return -1;
      const m = (el.innerText || "").match(/(\d{1,3})/);
      return m ? Number(m[1]) : -1;
    });
    record(
      "readiness score computes from real data",
      score > 0 && score < 100,
      `score=${score}`,
    );
  }

  await visit(page, "/dashboard/projects", [
    "Customer Churn Prediction",
    "core",
    "advanced",
  ]);

  await visit(page, "/dashboard/projects/ai-ml-project-core", [
    "Problem statement",
    "Your dataset",
    "Requirements",
    "How this is evaluated",
  ]);

  const badgesText = await visit(page, "/dashboard/badges", [
    "Skill Badges",
    "How to earn it",
  ]);
  if (badgesText) {
    record(
      "locked badges publish their criteria",
      badgesText.includes("Pass the final assessment"),
    );
  }

  await visit(page, "/dashboard/passport", [
    "Career Passport",
    "Publishing",
    "What the public profile shows",
  ]);

  await visit(page, "/dashboard/resume", [
    "Resume Builder",
    "Summary",
    "Experience",
    "Education",
  ]);

  await visit(page, "/dashboard/linkedin", [
    "LinkedIn Profile Builder",
    "Headline",
    "About",
    "Achievements",
  ]);

  await visit(page, "/dashboard/interview", [
    "Mock Interview Centre",
    "Technical Interview",
    "HR Interview",
    "Project Interview",
  ]);

  await visit(page, "/dashboard/assistant", [
    "Career Assistant",
    "What I can answer",
    "not a language model",
  ]);

  await visit(page, "/dashboard/challenges", ["Roystian Industry Challenge"]);

  await visit(page, "/dashboard/fellowship", [
    "Talent Fellowship",
    "Your eligibility",
    "requirements met",
  ]);

  await visit(page, "/dashboard/scholarship", [
    "Skill Scholarship",
    "Choose a support level",
  ]);

  // Existing V1 surfaces must still work.
  await visit(page, "/dashboard/learning", ["Learning"]);
  await visit(page, "/dashboard/assessments", ["Assessments"]);
  await visit(page, "/dashboard/certificate", ["Certificate"]);
  await visit(page, "/dashboard/profile", ["Profile"]);

  /* ─────────────── 4. Interactive: run a mock interview ─────────────── */
  console.log("\n── Interactive: mock interview ──────────────────");

  await page.goto(`${BASE}/dashboard/interview`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  const startBtn = page.locator("button", { hasText: "Start session" }).nth(1);
  if ((await startBtn.count()) > 0) {
    await startBtn.click();
    await page.waitForTimeout(700);

    const answer =
      "First, I was asked to cut a six-hour weekly report down. The problem was that three " +
      "source files arrived in different formats, so I built a validation step that rejected " +
      "malformed rows instead of silently dropping them. Then I automated the transformation " +
      "and added unit tests for the edge cases. The result was a four-minute job that has " +
      "caught two upstream data errors since. I would measure failure rate before optimising further.";

    // Walk every question, answering each one.
    for (let i = 0; i < 6; i++) {
      const ta = page.locator("textarea").first();
      if ((await ta.count()) === 0) break;
      await ta.fill(answer);
      await page.waitForTimeout(150);

      const next = page.locator("button", { hasText: "Next question" });
      const finish = page.locator("button", { hasText: "Finish and get feedback" });

      if ((await finish.count()) > 0) {
        await finish.click();
        break;
      } else if ((await next.count()) > 0) {
        await next.click();
        await page.waitForTimeout(300);
      } else break;
    }

    await page.waitForTimeout(2500);
    const fbText = await page.evaluate(() => document.body.innerText);
    const scored =
      fbText.includes("Session feedback") &&
      /Clarity/.test(fbText) &&
      /Structure/.test(fbText);
    record("mock interview produces scored feedback", scored);

    const m = fbText.match(/(\d{1,3})\s*\/\s*100/);
    record(
      "interview feedback score is a real number",
      m && Number(m[1]) > 0,
      m ? `score=${m[1]}` : "no score found",
    );
  } else {
    record("mock interview start button present", false);
  }

  /* ─────────────── 5. Interactive: publish the passport ─────────────── */
  console.log("\n── Interactive: publish Career Passport ─────────");

  await page.goto(`${BASE}/dashboard/passport`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const slugInput = page.locator("#slug");
  let slug = null;
  if ((await slugInput.count()) > 0) {
    slug = await slugInput.inputValue();
  }
  record("passport has a public slug", Boolean(slug), slug ?? "none");

  const publishSwitch = page.locator('button[role="switch"]').last();
  if ((await publishSwitch.count()) > 0) {
    const before = await publishSwitch.getAttribute("data-state");
    if (before !== "checked") {
      await publishSwitch.click();
      await page.waitForTimeout(900);
    }
    const after = await publishSwitch.getAttribute("data-state");
    record("passport can be published", after === "checked", `state=${after}`);
  }

  if (slug) {
    const profileText = await visit(page, `/profile/${slug}`, ["Roystian Foundation"], {
      settle: 1200,
    });
    if (profileText) {
      record(
        "published profile shows the student's real record",
        profileText.includes("Rahul") || profileText.includes("Career Readiness"),
      );
    }
  }

  // A profile that does not exist must not 500.
  await visit(page, "/profile/definitely-not-a-real-slug", ["Profile not found"], {
    settle: 1000,
  });

  /* ─────────────── 6. College journey ─────────────── */
  console.log("\n── College campus dashboard ─────────────────────");

  await context2Swap("college");
  const campusDest = await login(page, "college@roystian.demo", "college123");
  record(
    "college login lands on campus dashboard",
    campusDest.includes("/campus"),
    campusDest,
  );

  const campusText = await visit(page, "/campus", [
    "Students Enrolled",
    "Career Ready",
    "Avg Assessment",
  ]);
  if (campusText) {
    record(
      "campus dashboard shows a real cohort",
      /Vignan/i.test(campusText),
      campusText.slice(0, 80),
    );
  }

  await visit(page, "/campus/students", ["Students", "Readiness"]);
  await visit(page, "/campus/skill-gap", [
    "Skill Gap Report",
    "Student strengths",
    "Skill gaps",
  ]);

  /* ─────────────── 7. Admin journey ─────────────── */
  console.log("\n── Admin console ────────────────────────────────");

  await context2Swap("admin");
  const adminDest = await login(page, "admin@roystian.demo", "admin123");
  record("admin login lands on admin", adminDest.includes("/admin"), adminDest);

  await visit(page, "/admin", ["Overview"]);
  await visit(page, "/admin/projects", ["Project Submissions"]);
  await visit(page, "/admin/opportunities", [
    "Opportunities",
    "Challenges",
    "Fellowship",
    "Scholarship",
  ]);
  await visit(page, "/admin/students", ["Students"]);
  await visit(page, "/admin/leads", ["Leads"]);
  await visit(page, "/admin/analytics", ["Analytics"]);

  /* ─────────────── 8. Guard: unauthenticated access ─────────────── */
  console.log("\n── Route guards ─────────────────────────────────");

  await context2Swap("signed-out");
  await page.goto(`${BASE}/dashboard/readiness`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  record(
    "signed-out user is redirected away from the dashboard",
    page.url().includes("/login"),
    page.url(),
  );

  await page.goto(`${BASE}/campus`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  record(
    "signed-out user is redirected away from campus",
    page.url().includes("/login"),
    page.url(),
  );

  /* ─────────────── 9. Mobile viewport ─────────────── */
  console.log("\n── Mobile (390x844) ─────────────────────────────");

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  mpage.on("pageerror", (err) => pageErrors.push(err.message));

  for (const path of ["/", "/internships", "/for-students", "/colleges"]) {
    pageErrors = [];
    await mpage.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await mpage.waitForTimeout(700);

    const overflow = await mpage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    record(
      `${path} does not scroll horizontally on mobile`,
      overflow <= 1,
      `overflow=${overflow}px`,
    );
    if (pageErrors.length) {
      record(`${path} mobile has no exceptions`, false, pageErrors.join(" ; "));
    }
  }

  await mobile.close();
  await browser.close();

  /* ─────────────── Summary ─────────────── */
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + "═".repeat(60));
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exitCode = failed.length ? 1 : 0;
})().catch((err) => {
  console.error("HARNESS CRASHED:", err);
  process.exitCode = 2;
});
