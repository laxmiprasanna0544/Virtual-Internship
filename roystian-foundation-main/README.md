# Roystian Foundation — Virtual Internship & Skill Development Platform

> **Learn. Build. Get Certified. Move Forward.**

The Roystian Foundation virtual internship platform:

- a public site;
- student onboarding with Cashfree checkout;
- a learning dashboard with modules, server-scored assessments and practical tasks;
- certificates that are earned, never purchased, with public verification;
- career tools (projects, challenges, Career Passport, interviews, fellowship, scholarships);
- staff consoles for admins, trainers, college placement cells and partners.

It runs entirely on AWS:

| Concern | Service |
| --- | --- |
| App | Next.js 15 in Docker on **ECS Fargate**, behind an **ALB**, **CloudFront** and **AWS WAF** |
| Database | **Amazon RDS for PostgreSQL 17** (row level security on every table) |
| Accounts | **Amazon Cognito** (email sign-in, TOTP MFA, mandatory for staff) |
| Uploads | **Amazon S3** (private bucket, presigned POST/GET) |
| Email | **Amazon SES** |
| Secrets | **AWS Secrets Manager** |
| Monitoring | **CloudWatch** alarms → **SNS**, Route 53 health check |
| Infrastructure | **Terraform** in `infra/terraform` |
| CI/CD | **GitHub Actions** with OIDC to AWS |
| Payments | **Cashfree Payments** (signed webhooks) |

**Deploying:** [docs/DEPLOY-AWS.md](docs/DEPLOY-AWS.md).
**Test evidence:** [docs/TEST-REPORT.md](docs/TEST-REPORT.md).
**Manual acceptance script:** [TESTING.md](TESTING.md).

---

## Contents

1. [Architecture](#architecture)
2. [Local development](#local-development)
3. [Tests](#tests)
4. [Repository layout](#repository-layout)
5. [Security model](#security-model)
6. [Product rules enforced in code](#product-rules-enforced-in-code)
7. [Route map](#route-map)
8. [Configuration](#configuration)

---

## Architecture

```
Browser ─▶ CloudFront ─▶ WAF ─▶ ALB (CloudFront only) ─▶ ECS Fargate: Next.js
                                                          │  middleware: CSRF origin check, token refresh,
                                                          │              role/suspension/staff-MFA gates, CSP
                                                          ├─▶ RDS PostgreSQL (RLS)    ── server-side only
                                                          ├─▶ Cognito (USER_PASSWORD_AUTH, secret client)
                                                          ├─▶ S3 (presigned URLs)     ◀─ browser uploads directly
                                                          ├─▶ SES (email)
                                                          └─▶ Cashfree API            ─▶ signed webhook back
```

- **The browser never talks to the database.** Every read and write goes
  through a route handler (`app/api/**`). Work on behalf of a user runs in a
  transaction as the `authenticated` role, with `auth.uid()` set to the
  Cognito `sub`, so **row level security still applies** (`withUser()` in
  `lib/server/db.ts`). Public reads use `withAnon()`. Trusted decisions
  (payment completion, scoring, certificates, staff actions after a role
  check) run as the schema owner.
- **Tokens never reach JavaScript.** Cognito tokens live in `httpOnly`,
  `SameSite=Lax` cookies set by `/api/auth/*`. `middleware.ts` verifies the
  access token against the pool's JWKS and refreshes it when it expires.
- **One image for every environment.** The CSP is built per request from
  runtime configuration (uploads bucket, Cashfree environment). The same image
  runs migrations (`dbmate`) as a one-off ECS task before each deploy.

---

## Local development

You need Docker and Node.js ≥ 20.11. Local stand-ins replace the AWS services:

- `postgres:17` for RDS. The app role is not a superuser, exactly as on RDS.
- `moto` for Cognito, S3, SES and Secrets Manager.
- A Cashfree mock with a hosted checkout page and signed webhooks.

```bash
npm install
npm run aws:up        # docker compose: postgres :55432, moto :5055, cashfree mock :8787
npm run aws:setup     # resets + migrates the DB, creates the Cognito pool/client, S3 bucket,
                      # SES identity, seeds one account per role, writes .env.local
npm run dev           # http://localhost:3100
```

Local accounts (created by `aws:setup`; **never exist in production**):

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@roystian.local` | `Student12345` |
| Admin | `admin@roystian.local` | `Admin123456` |
| Trainer | `trainer@roystian.local` | `Trainer12345` |
| College | `college@roystian.local` | `College12345` |
| Partner | `partner@roystian.local` | `Partner12345` |

Staff accounts must set up an authenticator app at first sign-in. The
emulator accepts any 6-digit code; real Cognito does not.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on :3100 |
| `npm run build` / `npm run start:standalone` | Production build, run exactly as in Docker |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run verify` | Unit-level self-test of the product rules |
| `npm run aws:up` / `aws:down` / `aws:setup` | Local AWS stand-ins |
| `npm run db:migrate` | Apply `db/migrations` (dbmate) to `DATABASE_URL` |
| `npm run db:new <name>` | New migration file |
| `npm run db:types` | Regenerate `types/db.ts` from the live schema |

---

## Tests

```bash
npm run aws:up && npm run aws:setup
npm run build && npm run start:standalone     # in another terminal
npm run test:all                              # every integration suite → docs/test-evidence/
npm run test:e2e                              # real Chromium through the UI (needs Playwright)
```

| Suite | Covers |
| --- | --- |
| `test:rls` | Row level security, column grants, guard triggers and function privileges, directly in Postgres |
| `test:auth` | Cognito sign-up/confirm/sign-in, cookies, token forgery/refresh, password reset, MFA, suspension, staff MFA gate, rate limits |
| `test:journey` | Sign-up → Cashfree → webhook → modules → assessments → S3 upload → review → certificate → public verification → SES |
| `test:payments` | Webhook signatures, replay/idempotency, tampered amounts, failures, reconciliation, refunds |
| `test:admin` | Role enforcement on every admin route, trainer/college scoping, overrides, revocation, suspension, audit log |
| `test:career` | Projects, challenges (immutable after evaluation), passports, partner directory, interviews, scholarships, leads |
| `test:security` | Headers/CSP, CSRF on every POST route, auth on every route, upload abuse, input validation, JWT attacks, rate limits |
| `test:e2e` | Browser journeys with screenshots in `docs/test-evidence/screenshots/` |

CI (`.github/workflows/ci.yml`) runs all of them on every pull request.

---

## Repository layout

```
app/                    Next.js routes (pages + app/api route handlers)
components/             UI
lib/server/             Server-only: db (RLS helpers), session, cognito, storage (S3), email (SES),
                        cashfree, payments, staff/auth guards, rate limiting, CSP
lib/records/            Database rows → domain types
lib/*.ts                Client stores and pure rules (lib/rules.ts holds the product rules)
data/                   Static catalogue: domains, curriculum, assessments, programmes, projects …
db/bootstrap.sql        One-time role/database creation on RDS
db/migrations/          dbmate migrations (forward-only)
infra/terraform/        All AWS infrastructure
infra/local/            Local Postgres init
scripts/                Local setup, Cashfree mock, type generation, test suites
docs/                   Deployment guide, test report and evidence
```

---

## Security model

- **Roles:**
  - Every sign-up is a `student`.
  - Staff roles (`admin`, `trainer`, `college`, `partner`) are granted in SQL by an administrator. No API can grant them.
  - Staff need TOTP MFA before any staff page or API works (`STAFF_MFA_REQUIRED`).
- **Row level security** on all 23 tables:
  - Column grants stop users changing their role, status, enrolment or MFA flag.
  - Guard triggers make reviewed or evaluated work immutable to students.
  - Payments, attempts and certificates can only be written by server code.
- **Money:**
  - Prices come from the server-side catalogue.
  - A registration is created only by `complete_payment()`, after a signed webhook or a server-side order check with Cashfree.
  - Amounts are re-checked, and repeat webhooks change nothing.
- **Assessments:**
  - Scored on the server.
  - Answers are never sent to the browser, and a failed attempt reveals nothing.
  - Capped at 5 attempts per assessment per 24 hours.
- **Uploads:**
  - The presigned POST is limited to the student's own key prefix, 20 MB and an allow-listed content type (never HTML or SVG).
  - The server re-checks the stored object before accepting it, and deletes anything outside the rules.
- **Requests:**
  - CSRF origin check on every mutating API call; the Cashfree webhook is authenticated by signature instead.
  - Per-request CSP, plus HSTS, frame denial, `nosniff` and a strict referrer policy.
  - Rate limits in AWS WAF and in the app: per-IP limits are generous because colleges share an IP; per-account limits are strict.
- **Audit:** every staff action is written to `admin_audit_log`.

---

## Product rules enforced in code

1. **The certificate is never available on payment alone.** `lib/rules.ts` requires:
   - a complete profile;
   - every module completed;
   - every module assessment passed;
   - the practical task submitted;
   - the final assessment passed;
   - for Industry-Led, the 15-day programme duration.

   The server re-checks all of these before `issue_certificate()`.
2. **70% is the pass threshold** for module and final assessments.
3. **Self-Paced is never presented as a live programme.**
4. **No jobs, placements, accreditation or affiliations are promised.**
5. **Revoked certificates verify as revoked**, never as valid.
6. **Evaluated work is final.** Students cannot change a reviewed submission, an evaluated project or a scored challenge.

---

## Route map

**Public:**
- `/`, `/programs`, `/domains`, `/internships/[domain]`
- `/how-it-works`, `/colleges`, `/college-internships`, `/about`, `/pehlachance`
- `/verify`, `/verify/[certificateId]`, `/profile/[slug]`
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/terms`, `/privacy`, `/refund-policy`, `/sitemap.xml`, `/robots.txt`

**Onboarding and payment:**
- `/start/*`, `/checkout`
- `/payment/status` (Cashfree return URL), `/payment/success`

**Signed in:**
- `/account/security` (two-factor setup)
- Students: `/dashboard/*`
- Admins and trainers: `/admin/*` (trainers only their sections)
- Colleges: `/campus/*`
- Partners: `/partner/*`

---

## Configuration

Every variable is documented in [`.env.example`](.env.example). In AWS,
Terraform sets them on the ECS task definition. Secrets come from Secrets
Manager: the database URL, the Cognito client secret and the Cashfree keys.
