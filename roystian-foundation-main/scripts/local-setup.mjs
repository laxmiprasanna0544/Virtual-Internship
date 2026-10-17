/**
 * Local development and test setup.
 *
 *   npm run local:up       # docker compose: Postgres, S3 emulator, Cashfree mock
 *   npm run local:setup    # this script
 *
 * Resets the local database and the S3 emulator, then:
 *   1. recreates the "roystian" database and runs db/migrations with dbmate
 *      as the non-superuser app role (exactly as in production);
 *   2. creates the private uploads bucket (CORS for the local site);
 *   3. seeds one account per role (unless --no-seed);
 *   4. writes .env.local for `npm run dev` / `npm run start:standalone`.
 *
 * Emails (sign-up codes, password resets, receipts) are written as JSON to
 * .local/outbox instead of being sent. Refuses to touch anything not local.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes, scrypt } from "node:crypto";
import postgres from "postgres";
import { CreateBucketCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = new URL("..", import.meta.url).pathname;
const S3_ENDPOINT = process.env.LOCAL_S3_ENDPOINT ?? "http://localhost:5055";
const PG_ADMIN_URL = process.env.LOCAL_PG_ADMIN_URL ?? "postgres://postgres:postgres@localhost:55432/postgres";
const APP_DB_URL = process.env.LOCAL_DATABASE_URL ?? "postgres://roystian_app:roystian_local@localhost:55432/roystian";
const SITE_URL = process.env.LOCAL_SITE_URL ?? "http://localhost:3100";
const BUCKET = "roystian-local-uploads";
const OUTBOX = `${ROOT}.local/outbox`;
const seed = !process.argv.includes("--no-seed");

for (const url of [S3_ENDPOINT, PG_ADMIN_URL, APP_DB_URL]) {
  if (!/@?(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    console.error(`Refusing to run: ${url} is not local.`);
    process.exit(1);
  }
}

async function waitFor(label, fn) {
  for (let i = 0; i < 60; i += 1) {
    try {
      await fn();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`${label} did not become ready`);
}

/** Same format as lib/server/crypto.ts hashPassword(). */
function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(["scrypt", 32768, 8, 1, salt.toString("base64url"), key.toString("base64url")].join("$")),
    ),
  );
}

// 1. Database ------------------------------------------------------------------
const admin = postgres(PG_ADMIN_URL, { max: 1, onnotice: () => {} });
await waitFor("postgres", () => admin`select 1`);
await admin.unsafe(`
  select pg_terminate_backend(pid) from pg_stat_activity
  where datname = 'roystian' and pid <> pg_backend_pid()`);
await admin.unsafe("drop database if exists roystian");
await admin.unsafe("create database roystian owner roystian_app");
await admin.end();

execFileSync(
  "npx",
  ["dbmate", "--url", `${APP_DB_URL}?sslmode=disable`, "--migrations-dir", "db/migrations", "--no-dump-schema", "up"],
  { cwd: ROOT, stdio: "inherit" },
);
console.log("✓ database migrated as roystian_app (not a superuser)");

// 2. S3 emulator ------------------------------------------------------------------
await waitFor("S3 emulator", async () => {
  const res = await fetch(`${S3_ENDPOINT}/moto-api/reset`, { method: "POST" });
  if (!res.ok) throw new Error(String(res.status));
});
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
await s3.send(
  new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [{ AllowedOrigins: [SITE_URL], AllowedMethods: ["GET", "POST", "PUT"], AllowedHeaders: ["*"], MaxAgeSeconds: 3000 }],
    },
  }),
);
console.log(`✓ S3 bucket ${BUCKET}`);

// 3. Outbox and .env.local ------------------------------------------------------------
rmSync(OUTBOX, { recursive: true, force: true });
mkdirSync(OUTBOX, { recursive: true });

const envPath = `${ROOT}.env.local`;
if (existsSync(envPath) && /COGNITO|SUPABASE/.test(readFileSync(envPath, "utf8"))) {
  renameSync(envPath, `${envPath}.previous`);
  console.log("  (moved the previous .env.local to .env.local.previous)");
}
const env = {
  NEXT_PUBLIC_SITE_URL: SITE_URL,
  DATABASE_URL: APP_DB_URL,
  DATABASE_SSL: "disable",
  AUTH_SECRET: randomBytes(32).toString("base64url"),
  STAFF_MFA_REQUIRED: "true",
  // Same as DigitalOcean App Platform, which sets this header to the client IP.
  CLIENT_IP_HEADER: "do-connecting-ip",
  COOKIE_SECURE: "false",
  S3_UPLOADS_BUCKET: BUCKET,
  S3_ENDPOINT,
  S3_REGION: "us-east-1",
  S3_FORCE_PATH_STYLE: "true",
  S3_ACCESS_KEY_ID: "local",
  S3_SECRET_ACCESS_KEY: "local",
  EMAIL_OUTBOX_DIR: OUTBOX,
  CASHFREE_ENV: "mock",
  CASHFREE_API_BASE: "http://localhost:8787/pg",
  CASHFREE_APP_ID: "local-cashfree-app",
  CASHFREE_SECRET_KEY: "local-cashfree-secret",
};
writeFileSync(
  envPath,
  "# Generated by scripts/local-setup.mjs — local development only.\n" +
    Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") +
    "\n",
);
console.log("✓ wrote .env.local (emails go to .local/outbox)");

// 4. Seed ------------------------------------------------------------------------------
if (seed) {
  const accounts = [
    { email: "student@roystian.local", password: "Student12345", name: "Rahul Sharma", role: "student" },
    { email: "admin@roystian.local", password: "Admin123456", name: "Programme Administrator", role: "admin" },
    { email: "trainer@roystian.local", password: "Trainer12345", name: "Aarav Mehta", role: "trainer" },
    { email: "college@roystian.local", password: "College12345", name: "Vignan Institute of Technology", role: "college" },
    { email: "partner@roystian.local", password: "Partner12345", name: "Roystian Advanced Technologies", role: "partner" },
  ];
  const sql = postgres(APP_DB_URL, { max: 1, onnotice: () => {} });
  const ids = {};
  for (const account of accounts) {
    const [row] = await sql`
      insert into identity.users (email, password_hash, email_verified_at)
      values (${account.email}, ${await hashPassword(account.password)}, now())
      returning id`;
    ids[account.role] = row.id;
  }
  await sql.begin(async (tx) => {
    await tx`
      insert into public.colleges (id, name, city, state, type, departments, contact_email, contact_person, designation, phone)
      values ('college_vjit', 'Vignan Institute of Technology', 'Hyderabad', 'Telangana', 'engineering',
              ${["CSE", "ECE", "Mechanical", "IT"]}, 'college@roystian.local', 'Dr. A. Sharma',
              'Training & Placement Officer', '+91 90000 00001')`;
    for (const account of accounts) {
      await tx`select public.provision_student(${ids[account.role]}, ${account.email}, ${account.name}, '', '', '', '', 'undergraduate')`;
      if (account.role !== "student") {
        await tx`delete from public.students where id = ${ids[account.role]}`;
        await tx`
          update public.profiles
          set role = ${account.role}, college_id = ${account.role === "college" ? "college_vjit" : null}
          where id = ${ids[account.role]}`;
      }
    }
    await tx`
      insert into public.trainers (id, profile_id, name, title, industry, experience, specialization, bio, domains, initials, accent)
      values ('trainer-aarav-mehta', ${ids.trainer}, 'Aarav Mehta', 'Senior AI Engineer', 'Technology', '8+ years',
              'AI/ML & Data Systems', 'Trainer account for local development.',
              ${["ai-ml", "data-analytics", "software-development"]}, 'AM', 'indigo')`;

    // Rahul: AI/ML Industry-Led, paid through the normal payment path, 4 of 10 modules done.
    const rahul = ids.student;
    await tx`
      update public.students
      set mobile = '9000012345', college = 'Vignan Institute of Technology',
          course = 'B.Tech Computer Engineering', city = 'Hyderabad'
      where id = ${rahul}`;
    await tx`
      insert into public.payments (student_id, amount_paise, status, provider, provider_order_id, domain_id, program_id, experience)
      values (${rahul}, 500000, 'pending', 'cashfree', 'RF-SEED-RAHUL', 'ai-ml', 'industry-led', 'beginner')`;
    const [reg] = await tx`
      select * from public.complete_payment('RF-SEED-RAHUL', 500000, 'upi', 'seed-payment', '{}'::jsonb, 'AIML')`;
    await tx`update public.registrations set created_at = now() - interval '9 days', start_date = current_date - 9 where id = ${reg.id}`;
    await tx`update public.payments set created_at = now() - interval '9 days' where registration_id = ${reg.id}`;
    await tx`update public.students set enrolled_at = now() - interval '9 days' where id = ${rahul}`;
    await tx`
      update public.module_progress
      set completed_modules = ${["ai-ml-m01", "ai-ml-m02", "ai-ml-m03", "ai-ml-m04"]}, last_module_id = 'ai-ml-m04'
      where student_id = ${rahul} and domain_id = 'ai-ml'`;
    for (let n = 1; n <= 4; n += 1) {
      await tx`
        insert into public.assessment_attempts (student_id, domain_id, assessment_id, kind, score, total, percentage, passed, submitted_at)
        values (${rahul}, 'ai-ml', ${`ai-ml-m${String(n).padStart(2, "0")}-assessment`}, 'module', 4, 5, 80, true,
                now() - make_interval(days => ${9 - n * 2}))`;
    }
    await tx`
      insert into public.notifications (user_id, type, title, body, href, created_at)
      values (${rahul}, 'success', 'Registration confirmed',
              ${`Your AI/ML virtual internship is active. Registration ID ${reg.id}.`}, '/dashboard', now() - interval '9 days')`;
  });
  await sql.end();

  console.log("✓ seeded local accounts (local only — never in production):");
  for (const a of accounts) console.log(`    ${a.role.padEnd(8)} ${a.email.padEnd(26)} ${a.password}`);
  console.log("  Staff accounts set up an authenticator app at first sign-in.");
}
