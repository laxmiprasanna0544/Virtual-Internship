# Test report: AWS-native release

**Date:** 11 October 2026 · **Branch:** `feat/aws-native` · **Evidence:** `docs/test-evidence/`

## Summary

| Area | Result |
| --- | --- |
| Integration suites against the production build (`node .next/standalone/server.js`) | **742 passed, 0 failed, 2 skipped** |
| Same suites against the **Docker image** (`roystian-web`, non-root, healthy) | **741 passed, 1 failed, 2 skipped**: the failure is a local-networking artifact, explained below |
| Browser end-to-end (Playwright, real Chromium) | **36 passed, 0 failed**, 35 screenshots, no console errors |
| Typecheck · ESLint · rule self-test · production build | clean · clean · all passed · succeeds |
| Terraform `validate` / `fmt` | valid / clean |
| Checkov IaC scan | 259 passed, 49 failed; every remaining finding is accepted with reasons (DEPLOY-AWS.md §12) |
| Migrations | Applied by a **non-superuser** role from the Docker image's own `dbmate`. The RDS bootstrap was proven with a non-superuser master that has CREATEROLE/CREATEDB. |

### Where the tests ran

No AWS account was used. Each AWS service ran as a local stand-in on the same APIs:

| Production | Local stand-in |
| --- | --- |
| Amazon RDS for PostgreSQL 17 | `postgres:17-alpine`, with the app role not a superuser, as on RDS |
| Cognito, S3, SES, Secrets Manager | `moto` AWS emulator |
| Cashfree PG | `scripts/mock-cashfree.mjs`: the Cashfree 2023-08-01 API, a hosted checkout page, and HMAC-signed webhooks |

**Supabase is fully removed.** No packages, code, migrations or configuration remain.

## Evidence index

| File | Contents |
| --- | --- |
| `rls.log` | 99 checks: row level security, column grants, guard triggers and function privileges, run directly in Postgres |
| `auth.log` | 58 checks: Cognito sign-up/confirm/sign-in, cookie flags, forged/unsigned/foreign tokens, refresh, password reset, TOTP MFA, suspension, staff MFA gate, rate limits |
| `journey.log` | 47 checks: sign-up → Cashfree → signed webhook → enrolment → modules → server-scored assessments → attempt cap → S3 upload → trainer review → 15-day gate → certificate → public verification → SES emails |
| `payments.log` | 43 checks: bad, missing and garbage signatures, replay idempotency, tampered amount, failed payment, cross-user access, reconciliation without a webhook, refunds through the gateway |
| `admin.log` | 89 checks: every admin route against every role, trainer and college scoping, overrides, certificate revoke/restore, suspension via Cognito, leads, audit log |
| `career.log` | 81 checks: projects and challenges immutable after evaluation, passports and public profiles, partner directory, interviews, scholarships, notifications, leads |
| `security.log` | 325 checks: headers and CSP, CSRF on every POST route, auth on all 55 route files, open redirects, upload abuse, malformed input, JWT attacks, rate limits, robots/sitemap |
| `browser-e2e.log` + `screenshots/` | Public pages, the full student journey through the UI, staff MFA enrolment and review, password reset |
| `container/` | The seven suites re-run against the Docker image |
| `summary.json` | Machine-readable totals |
| `static-checks.log`, `terraform-validate.log`, `checkov.log` | Static analysis output |

## Explained non-passes

| Item | Why | How to close it |
| --- | --- | --- |
| SKIP: old refresh token stops working after sign-out | moto doesn't implement `RevokeToken` and rejects `GlobalSignOut`, so it never revokes a token. The app calls both on logout. | Staging check in DEPLOY-AWS.md §10 |
| SKIP: email change is confirmed with Cognito's verified address | moto re-keys the user on `UpdateUserAttributes`, so `VerifyUserAttribute` can't find it. The app's guard (the address is never taken from the request) is tested. | Staging check in DEPLOY-AWS.md §10 |
| Container run: "mock environment returns a hosted checkout URL" | Inside Docker the app reaches the mock as `host.docker.internal`, so the checkout URL carries that host name rather than `localhost`. The same check passes against the host build. Production uses real Cashfree, not the mock. | None needed |
| Confirmation and reset codes | The emulator accepts any 6-digit code; real Cognito validates them. | Staging check in DEPLOY-AWS.md §10 |
| Upload policy enforcement by S3 | The emulator doesn't enforce presigned-POST conditions. The app's own server-side re-check (size, type, owner prefix; deletes bad objects) **is** tested. | Real S3 enforces both layers |
| WAF, CloudFront, ALB origin lock, RDS failover | Infrastructure behaviour can't be exercised locally. The configuration is validated by Terraform and Checkov. | Go-live checklist, DEPLOY-AWS.md §10 |

## Defects found by testing and fixed

| # | Defect | Fix |
| --- | --- | --- |
| 1 | Login failed with a 500: Postgres timestamps (`+00` offset) didn't parse in JavaScript | `lib/server/db.ts` normalises timestamps to ISO |
| 2 | A Career Passport address clashed with another student's private passport, giving a 500 | The slug lookup bypasses RLS (slugs are public) and inserts retry on a unique violation |
| 3 | Staff were stuck on the two-factor page after enabling it (cached redirect) | Full-page navigation after enrolment |
| 4 | The profile page blanked the education level on load, so saving failed. This predates the rewrite. | Ignore the empty value Radix emits on mount |
| 5 | Sign-out triggered 401 refetches (console errors) | Stores clear themselves on the sign-out event |
| 6 | Logout relied on GlobalSignOut only | Logout also calls `RevokeToken` on the refresh token |
| 7 | Rate limits keyed on a client-controlled `X-Forwarded-For`, and per-IP limits would block a college lab sharing one IP | Client IP from `CloudFront-Viewer-Address`; generous per-IP limits; strict per-email and per-user limits |
| 8 | The WAF auth rule would have counted the session check on every page view | The rule is limited to POSTs; thresholds sized for shared campus IPs |
| 9 | Email-change confirmation trusted the email in the request body | The address is read back from Cognito after verification |
| 10 | `db/bootstrap.sql` would fail on RDS, where the master user is not a superuser | Grant the owning role to the master first; proven with a non-superuser master |
| 11 | Production build failed on a non-route export in a route file | Made the constant module-private |

## Audit findings closed in this release

- **Payments are real Cashfree, verified server-side:**
  - The server creates the order, with the amount taken from the catalogue.
  - The webhook must carry a valid HMAC signature, and its amount is checked.
  - A repeat webhook or a racing status check changes nothing.
  - If the webhook never arrives, a server-side order check reconciles the payment.
  - Refunds go through the Cashfree API first, then a single database transaction.
  - The simulated checkout is deleted.
- **Assessments:** a failed attempt reveals nothing, and attempts are capped at 5 per 24 hours.
- **Evaluated projects and scored challenges are final:**
  - The guard triggers block any change after evaluation.
  - Students lost the delete policy on challenge entries.
  - Column grants stop students moving records between students, projects or domains.
- **Indexes** on every foreign key and RLS filter column.
- **Suspension is enforced immediately:** a database check on every student API and protected page, plus the Cognito account is disabled and signed out globally.
- **Staff must use TOTP MFA.**
- **Abuse protection:**
  - The CSRF origin check covers every mutating API.
  - Rate limits apply in the app and in WAF.
  - The college enquiry form has a honeypot and a rate limit.
- **Content:** legal pages rewritten for AWS and Cashfree; demo labels, seeded IDs and the browser demo database removed; site URL taken from `NEXT_PUBLIC_SITE_URL` only.
- **Operations:**
  - Every service is defined in Terraform.
  - CI runs every suite on each pull request.
  - Deploys go through OIDC with migrations first, with error alarms and uptime checks.

## Still open: decisions for the organisation, not code

1. **Business content:**
   - `NEXT_PUBLIC_CONTACT_EMAIL` must be set to a real inbox.
   - `SITE.phone` in `data/content.ts` is a placeholder.
   - `data/trainers.ts` holds fictional trainer personas (bios say "Demo profile…"). They still appear by name on the internship, schedule and admin trainer pages.
2. **Legal review** of `/privacy`, `/terms` and `/refund-policy` by counsel.
3. **College visibility is self-declared:** a student's college is free text, so any student can appear in a college's cohort. Fixing this properly needs a product decision, such as college-verified rosters or institutional email domains.
4. **No upload control for project reports:** the API supports report uploads, but the UI has never had a file picker.
5. **Fellowship "eligible applicant" path:** an ineligible student is refused (tested), but the eligible path is not covered end to end.
6. **`npm audit`:** 7 issues, all in Tailwind 3's build-time toolchain and none shipped at runtime. The fix is a major upgrade to Tailwind 4.
7. **Not yet tested on real AWS:** the staging-only checks in DEPLOY-AWS.md §10 must pass on a real AWS stack (real Cognito, SES production access, Cashfree sandbox, then production) before DNS moves.
