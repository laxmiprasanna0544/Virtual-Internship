/**
 * Browser end-to-end tests: real Chromium driving the real UI.
 *
 * Playwright:
 *   npm i -D playwright            # already a devDependency
 *   npx playwright install chromium
 *
 * Needs the production build running against the local stand-ins:
 *   npm run aws:up && npm run aws:setup
 *   npm run build && npm run start:standalone        # http://localhost:3100
 *   npm run test:e2e                                 # HEADED=1 to watch
 *
 * Journeys: public pages (no demo wording), student sign-up → onboarding →
 * Cashfree checkout (local mock) → dashboard → module → assessment →
 * practical task upload (browser → S3 presigned POST) → profile → sign out;
 * staff sign-in → forced TOTP enrolment → admin console → review the
 * student's submission; password reset with an emailed code.
 *
 * Screenshots go to docs/test-evidence/screenshots/. Any page error or
 * console error (other than a favicon 404) fails the run.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { BASE, Client, curriculum, latestCode, newStaff, newStudent, PASSWORD, sql, totp, uniqueEmail } from "./lib.mjs";

const SHOTS = new URL("../../docs/test-evidence/screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const { getDomain } = curriculum();
const DOMAIN = getDomain("ai-ml");
const TIMEOUT = 20_000;

const results = [];
const consoleErrors = [];
let shot = 0;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${!ok && detail ? ` — ${detail}` : ""}`);
}

async function screenshot(page, name) {
  shot += 1;
  const file = `${String(shot).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: `${SHOTS}${file}`, fullPage: true });
  return file;
}

function watch(page, journey) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const source = msg.location()?.url ?? "";
    if (/favicon/i.test(text) || /favicon/i.test(source)) return;
    // The verify page asks the API about an unknown id on purpose; 404 is the answer.
    if (/\/api\/certificates\/verify\/RF-NONE-/.test(source) && /404/.test(text)) return;
    consoleErrors.push({ journey, url: page.url(), text: source ? `${text} [${source}]` : text });
  });
  page.on("pageerror", (error) => consoleErrors.push({ journey, url: page.url(), text: `pageerror: ${error.message}` }));
}

/** Runs the steps of one journey; a failing step ends that journey. */
async function journey(name, browser, steps) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  context.setDefaultTimeout(TIMEOUT);
  const page = await context.newPage();
  watch(page, name);
  try {
    for (const [label, fn] of steps) {
      try {
        await fn(page);
        record(`${name}: ${label}`, true);
      } catch (error) {
        record(`${name}: ${label}`, false, error.message.split("\n")[0]);
        await screenshot(page, `FAILED-${name}-${label}`.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()).catch(() => {});
        break;
      }
    }
  } finally {
    await context.close();
  }
}

async function expectText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
}

/**
 * Visible body text must not present the product as a demo. Recorded as its
 * own check (a failure fails the run) without stopping the journey, so one
 * wording problem doesn't hide functional failures further on.
 */
async function assertNoDemoWording(page) {
  const text = await page.locator("body").innerText();
  // "Request a Demo" is a sales call-to-action for colleges, not demo content.
  const cleaned = text.replace(/Request a Demo/gi, "");
  const hit = /\bdemo\b|demo environment|simulated|localStorage|supabase/i.exec(cleaned);
  const path = new URL(page.url()).pathname;
  record(
    `no demo wording on ${path}`,
    !hit,
    hit && `found "${hit[0]}" near: …${cleaned.slice(Math.max(0, hit.index - 60), hit.index + 60).replace(/\s+/g, " ")}…`,
  );
}

const headless = process.env.HEADED !== "1";
const browser = await chromium.launch({ headless });

/* ------------------------------------------------------------------ */
/*  a. Public pages                                                    */
/* ------------------------------------------------------------------ */

const publicPages = [
  ["/", "home"],
  ["/programs", "programs"],
  ["/internships/ai-ml", "internship-ai-ml"],
  ["/privacy", "privacy"],
  ["/terms", "terms"],
  ["/refund-policy", "refund-policy"],
];

await journey(
  "public",
  browser,
  [
    ...publicPages.map(([path, name]) => [
      `${path} renders`,
      async (page) => {
        const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        if (!res || res.status() !== 200) throw new Error(`status ${res?.status()}`);
        await assertNoDemoWording(page);
        await screenshot(page, name);
      },
    ]),
    [
      "/verify reports an unknown certificate as not found",
      async (page) => {
        await page.goto(`${BASE}/verify`, { waitUntil: "networkidle" });
        await assertNoDemoWording(page);
        await screenshot(page, "verify");
        await page.getByLabel("Certificate ID").fill("RF-NONE-2026-999999");
        await page.getByRole("button", { name: "Verify" }).click();
        await page.waitForURL(/\/verify\/RF-NONE-2026-999999/);
        await expectText(page, "Certificate Not Found");
        await screenshot(page, "verify-not-found");
      },
    ],
  ],
);

/* ------------------------------------------------------------------ */
/*  b. Student journey                                                 */
/* ------------------------------------------------------------------ */

const studentEmail = uniqueEmail("e2e");
const studentName = `E2E Browser ${Date.now().toString().slice(-6)}`;
let studentId = null;

await journey("student", browser, [
  [
    "register and confirm the emailed code, then auto sign-in",
    async (page) => {
      await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
      await page.getByLabel("Full Name").fill(studentName);
      await page.getByLabel("Email").fill(studentEmail);
      await page.getByLabel("Mobile").fill("9876543210");
      await page.getByLabel("City").fill("Hyderabad");
      await page.getByLabel("College / Institution").fill("Vignan Institute of Technology");
      await page.getByLabel("Course / Degree").fill("B.Tech Computer Engineering");
      await page.locator("#educationLevel").click();
      await page.getByRole("option", { name: "Undergraduate" }).click();
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByLabel("Confirm Password").fill(PASSWORD);
      await screenshot(page, "register-form");
      await page.getByRole("button", { name: "Create account" }).click();
      await expectText(page, "Enter the 6-digit code we emailed to");
      await screenshot(page, "register-confirm-code");
      await page.getByPlaceholder("123456").fill(await latestCode(studentEmail, /verification/i));
      await page.getByRole("button", { name: "Confirm email" }).click();
      await page.waitForURL(/\/start$/);
      const [row] = await sql`select id from public.profiles where email = ${studentEmail}`;
      if (!row) throw new Error("no profile row after sign-up");
      studentId = row.id;
    },
  ],
  [
    "onboarding: profile → domain → experience → programme",
    async (page) => {
      await page.getByLabel("Full Name").waitFor();
      await page.waitForFunction(() => (document.querySelector("#mobile")?.value ?? "").length > 0);
      await screenshot(page, "start-profile");
      await page.getByRole("button", { name: /Continue to domain/ }).click();
      await page.waitForURL(/\/start\/domain$/);
      await page.getByRole("radio", { name: new RegExp(DOMAIN.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
      await screenshot(page, "start-domain");
      await page.getByRole("button", { name: /Continue to experience/ }).click();
      await page.waitForURL(/\/start\/experience$/);
      await page.getByRole("radio", { name: /Beginner/ }).click();
      await screenshot(page, "start-experience");
      await page.getByRole("button", { name: /Continue to programme/ }).click();
      await page.waitForURL(/\/start\/program$/);
      await screenshot(page, "start-program");
      await page.getByRole("button", { name: "Choose Industry-Led" }).click();
      await page.waitForURL(/\/checkout$/);
    },
  ],
  [
    "checkout redirects to the Cashfree hosted page",
    async (page) => {
      await page.getByRole("button", { name: /PAY .* START MY INTERNSHIP/ }).waitFor();
      await assertNoDemoWording(page);
      await screenshot(page, "checkout");
      await page.getByRole("button", { name: /PAY .* START MY INTERNSHIP/ }).click();
      await page.waitForURL(/localhost:8787\/checkout\//);
      await screenshot(page, "cashfree-mock-checkout");
    },
  ],
  [
    "pay on the gateway → status page → success",
    async (page) => {
      await page.getByRole("button", { name: /^Pay/ }).click();
      await page.waitForURL(/\/payment\/(status|success)/);
      await screenshot(page, "payment-status");
      await page.waitForURL(/\/payment\/success\?registrationId=RF-AIML-/, { timeout: 60_000 });
      await expectText(page, "RF-AIML-");
      await screenshot(page, "payment-success");
    },
  ],
  [
    "dashboard shows the enrolment",
    async (page) => {
      await page.getByRole("link", { name: /GO TO MY DASHBOARD/ }).click();
      await page.waitForURL(/\/dashboard$/);
      await expectText(page, DOMAIN.name);
      await assertNoDemoWording(page);
      await screenshot(page, "dashboard");
    },
  ],
  [
    "open a learning module and mark it complete",
    async (page) => {
      const moduleId = DOMAIN.modules[0].id;
      await page.goto(`${BASE}/dashboard/learning/${moduleId}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Mark Module Complete/ }).click();
      await page.getByRole("button", { name: /Mark incomplete/ }).waitFor();
      await screenshot(page, "module-complete");
      const [row] = await sql`select completed_modules from public.module_progress where student_id = ${studentId} and domain_id = 'ai-ml'`;
      if (!row?.completed_modules?.includes(moduleId)) throw new Error("module not stored as complete");
    },
  ],
  [
    "take a module assessment and see the score",
    async (page) => {
      const assessmentId = `${DOMAIN.modules[1].id}-assessment`;
      await page.goto(`${BASE}/dashboard/assessments/${assessmentId}`, { waitUntil: "networkidle" });
      await page.locator("fieldset legend").first().waitFor();
      await assertNoDemoWording(page);
      await screenshot(page, "assessment-question");
      for (let guard = 0; guard < 40; guard += 1) {
        await page.locator("fieldset label").first().click();
        const next = page.getByRole("button", { name: /^Next/ });
        if (await next.isVisible()) await next.click();
        else break;
      }
      await page.getByRole("button", { name: /Submit Assessment/ }).click();
      await page.getByRole("button", { name: /^Submit$/ }).click();
      await expectText(page, "Assessment complete");
      await expectText(page, "You scored");
      await screenshot(page, "assessment-result");
    },
  ],
  [
    "submit the practical task with a PDF uploaded to S3",
    async (page) => {
      await page.goto(`${BASE}/dashboard/assignments`, { waitUntil: "networkidle" });
      const task = DOMAIN.practicalTask;
      const text =
        `${task.title}. ${task.brief} ${task.requirements.join(". ")}. ` +
        "I prepared the dataset, trained a baseline model, compared it with an improved version, " +
        "and documented the evaluation metrics, findings and next steps in the attached report.";
      await page.locator("#submission-text").fill(text);
      await page.getByRole("tab", { name: "Upload file" }).click();
      await page.getByLabel("Choose a file to attach").setInputFiles({
        name: "e2e-report.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
      });
      await expectText(page, "e2e-report.pdf");
      await screenshot(page, "practical-task-filled");
      await page.getByRole("button", { name: /Submit task/ }).click();
      await expectText(page, "Practical task submitted");
      await screenshot(page, "practical-task-submitted");
      const [row] = await sql`select status, file_path from public.submissions where student_id = ${studentId} and domain_id = 'ai-ml'`;
      if (row?.status !== "submitted" || !row.file_path?.startsWith(`submissions/${studentId}/`)) {
        throw new Error(`submission not stored with an S3 key: ${JSON.stringify(row)}`);
      }
    },
  ],
  [
    "profile page",
    async (page) => {
      await page.goto(`${BASE}/dashboard/profile`, { waitUntil: "networkidle" });
      // The profile form shows the account's details in its inputs.
      await page.waitForFunction(
        (email) => [...document.querySelectorAll("input")].some((input) => input.value === email),
        studentEmail,
      );
      // Regression: the education level chosen at sign-up must show, not the placeholder.
      await page.locator("#educationLevel").getByText("Undergraduate").waitFor();
      await screenshot(page, "profile");
    },
  ],
  [
    "sign out",
    async (page) => {
      await page.getByRole("button", { name: "Logout" }).click();
      await page.waitForURL(`${BASE}/`);
      await page.goto(`${BASE}/dashboard`);
      await page.waitForURL(/\/login\?next=%2Fdashboard/);
      await screenshot(page, "signed-out-redirect");
    },
  ],
]);

/* ------------------------------------------------------------------ */
/*  c. Staff journey                                                   */
/* ------------------------------------------------------------------ */

let staffEmail = null;
await journey("staff", browser, [
  [
    "admin signs in and is forced to enrol an authenticator",
    async (page) => {
      ({ email: staffEmail } = await newStaff(new Client("e2e-staff"), "admin", { mfa: false }));
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.getByLabel("Email").fill(staffEmail);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(/\/account\/security\?required=1/);
      await screenshot(page, "staff-mfa-required");
    },
  ],
  [
    "set up TOTP (QR code) and land on the admin console",
    async (page) => {
      await page.getByRole("button", { name: /Set up authenticator app/ }).click();
      await page.getByAltText("QR code for your authenticator app").waitFor();
      await screenshot(page, "staff-mfa-qr");
      // The key shown for manual entry, exactly as an authenticator app would use it.
      const secret = (await page.locator("code").filter({ hasText: /^[A-Z2-7]{32}$/ }).first().innerText()).trim();
      if (!secret) throw new Error("authenticator key not shown");
      await page.getByPlaceholder("123456").fill(totp(secret));
      await page.getByRole("button", { name: /Verify and turn on/ }).click();
      await page.waitForURL(/\/admin$/);
      await page.waitForLoadState("networkidle");
      await assertNoDemoWording(page);
      await screenshot(page, "admin-overview");
    },
  ],
  [
    "students list → the student from the student journey",
    async (page) => {
      if (!studentId) throw new Error("student journey did not create a student");
      await page.goto(`${BASE}/admin/students`, { waitUntil: "networkidle" });
      await page.getByPlaceholder("Search by name, email, college or registration ID").fill(studentName);
      await page.getByRole("link", { name: `View ${studentName}` }).click();
      await page.waitForURL(new RegExp(`/admin/students/${studentId}`));
      await expectText(page, studentEmail);
      await screenshot(page, "admin-student-detail");
    },
  ],
  [
    "assignments page shows the submission and the admin approves it",
    async (page) => {
      await page.goto(`${BASE}/admin/assignments`, { waitUntil: "networkidle" });
      await page.getByPlaceholder("Search by student or task").fill(studentName);
      const card = page.locator("li").filter({ hasText: studentName }).first();
      await card.waitFor();
      await card.getByText("e2e-report.pdf").waitFor();
      await screenshot(page, "admin-assignments");
      await card.getByRole("button", { name: "Review" }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Approve/ }).click();
      await card.getByText("Approved").waitFor();
      await screenshot(page, "admin-assignment-approved");
      const [row] = await sql`select status from public.submissions where student_id = ${studentId}`;
      if (row?.status !== "approved") throw new Error(`status is ${row?.status}`);
    },
  ],
]);

/* ------------------------------------------------------------------ */
/*  d. Password reset                                                  */
/* ------------------------------------------------------------------ */

const NEW_PASSWORD = "Res3tPassword9";
let resetEmail = null;
await journey("password-reset", browser, [
  [
    "request a reset code",
    async (page) => {
      ({ email: resetEmail } = await newStudent(new Client("e2e-reset")));
      await page.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
      await page.getByLabel("Email").fill(resetEmail);
      await screenshot(page, "forgot-password");
      await page.getByRole("button", { name: /Send reset code/ }).click();
      await page.getByLabel("6-digit code").waitFor();
    },
  ],
  [
    "enter the code and a new password",
    async (page) => {
      await page.getByLabel("6-digit code").fill(await latestCode(resetEmail, /reset/i));
      await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
      await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
      await screenshot(page, "reset-password-form");
      await page.getByRole("button", { name: /Update password/ }).click();
      await page.waitForURL(/\/login$/);
    },
  ],
  [
    "sign in with the new password",
    async (page) => {
      await page.getByLabel("Email").fill(resetEmail);
      await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(/\/dashboard/);
      await screenshot(page, "signed-in-after-reset");
    },
  ],
]);

await browser.close();

/* ------------------------------------------------------------------ */
/*  Summary                                                            */
/* ------------------------------------------------------------------ */

record("no console or page errors", consoleErrors.length === 0, `${consoleErrors.length} error(s)`);
for (const e of consoleErrors) console.log(`  [${e.journey}] ${e.url}\n    ${e.text}`);

const failed = results.filter((r) => !r.ok).length;
console.log(`\nbrowser e2e: ${results.length - failed} passed, ${failed} failed, ${shot} screenshots in docs/test-evidence/screenshots/`);
await sql.end({ timeout: 5 });
process.exit(failed ? 1 : 0);
