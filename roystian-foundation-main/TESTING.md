# Manual acceptance test

A walk-through for a person checking the platform before a release. The
automated suites (`npm run test:all`, `npm run test:e2e`, see the README)
cover the same ground and more. Use this script for the things only a person
can judge (copy, layout, emails in a real inbox), and for the checks the
local emulator cannot make (marked **staging only**).

**Where to run it**

- **Local:** `npm run aws:up && npm run aws:setup && npm run dev`, then open
  http://localhost:3100. The emulator accepts any 6-digit code, and emails are
  captured, not delivered.
- **Staging:** a copy of the Terraform stack with `cashfree_env = "sandbox"`.
  Real Cognito, real SES, Cashfree sandbox.

Record the result of each step (pass/fail, notes, a screenshot where useful).

---

## A. Public site

| # | Step | Expected |
| --- | --- | --- |
| A1 | Open `/` | Hero, domains, programmes and FAQ load. No "demo", "simulated" or "sample data" wording anywhere. |
| A2 | Open `/programs` and an `/internships/<domain>` page | Prices: Self-Paced ₹1,500, Industry-Led ₹5,000. The curriculum is listed. |
| A3 | Open `/verify` and enter `RF-AIML-2026-999999` | "Certificate not found". |
| A4 | Open `/privacy`, `/terms` and `/refund-policy` | They describe AWS (Cognito, RDS, S3, SES, Mumbai) and Cashfree, show "Last updated" and have no demo banner. |
| A5 | Submit the college enquiry form on `/colleges` | Success message; the lead appears for an admin under **Leads**. |
| A6 | View the page source / response headers | A `Content-Security-Policy` header is present; there is no `X-Powered-By`. |

## B. Student account

| # | Step | Expected |
| --- | --- | --- |
| B1 | `/register` with password `password` | Refused: 10+ characters with upper case, lower case and a number. |
| B2 | Register with a valid password | "Enter the 6-digit code we emailed". Email arrives from `no-reply@<domain>` (**staging**: check DKIM=pass). |
| B3 | Enter a wrong code (**staging only**) | "That code is not correct". |
| B4 | Enter the right code | Signed in automatically and taken to `/start`. |
| B5 | Sign out, then sign in with the wrong password | "Incorrect email or password". |
| B6 | `/forgot-password`, then use the code and a new password | The old password no longer works; the new one does. |
| B7 | Sign out, then reuse the old cookie (**staging only**; use DevTools to restore `rf_at`/`rf_rt`) | Still signed out: the refresh token was revoked. |
| B8 | Profile → change the email (**staging only**) | A code goes to the new address; the old address works until the code is entered. |
| B9 | Account security → set up an authenticator app (optional for students) | QR code shown; after enabling, every sign-in asks for a code. |

## C. Enrolment and payment

| # | Step | Expected |
| --- | --- | --- |
| C1 | `/start` → profile → domain → experience → recommendation → programme | Choices are carried through; the recommendation reflects the inputs. |
| C2 | Checkout | Order summary with the server price, then a redirect to Cashfree (local: the mock page; staging: the Cashfree sandbox). |
| C3 | Fail the payment | Back on `/payment/status`: "payment failed", with a retry link. No enrolment. |
| C4 | Pay | `/payment/status` → success with a registration ID such as `RF-AIML-2026-001001` → dashboard. A confirmation email arrives. |
| C5 | Try to buy the same domain again | Refused: already enrolled. |

## D. Learning

| # | Step | Expected |
| --- | --- | --- |
| D1 | Open a module, add a note, mark it complete | Progress updates on the dashboard; the note persists after a reload. |
| D2 | Take a module assessment and fail it | Score shown, but **not** which answers were right. Attempts left are shown. |
| D3 | Fail it 5 times within 24 hours | The 6th attempt is refused until the next day. |
| D4 | Pass an assessment | Full review with explanations; the module is marked complete. |
| D5 | Practical task: upload a PDF over 20 MB | Refused. |
| D6 | Practical task: upload a small PDF and submit | Submitted. The file downloads for a reviewer. |
| D7 | Certificate page before all requirements are met | Locked, with the missing requirements listed (Industry-Led also waits 15 days). |

## E. Staff

Grant roles in SQL (see docs/DEPLOY-AWS.md §9).

| # | Step | Expected |
| --- | --- | --- |
| E1 | Sign in as a new staff member | Sent to `/account/security`. Nothing else works until an authenticator is enrolled. |
| E2 | Admin → Students → a student | Profile, enrolment, progress, assessments, submission and certificate are shown. |
| E3 | Assignments → open the file → approve with feedback | The student gets a notification; the student can no longer change the submission. |
| E4 | Trainer for another domain | Cannot see that student; review and download are refused. |
| E5 | College account | Sees only students from its own college. |
| E6 | Admin → Certificates → revoke | `/verify/<id>` shows **revoked**. Restoring shows it valid again. |
| E7 | Admin → Payments → refund | The refund appears in Cashfree (staging sandbox); the student loses access to that domain. |
| E8 | Admin → Students → suspend | The student is signed out and cannot sign in; reactivating restores access. |
| E9 | Settings / Domains / Programmes / Trainers | Read-only catalogue views, with no "reset demo data". |
| E10 | Check the audit log (SQL: `select * from admin_audit_log order by created_at desc`) | Every action above is listed with the staff member who did it. |

## F. Career tools

| # | Step | Expected |
| --- | --- | --- |
| F1 | Projects: start, draft, submit; a trainer evaluates | Score shown; the student can no longer edit it. |
| F2 | Challenges: submit; an admin scores; resubmit | Resubmission refused; the score is unchanged. |
| F3 | Career Passport: publish, open `/profile/<slug>` signed out | Only the sections the student switched on are visible; contact details are hidden by default. |
| F4 | Partner account → talent directory | Lists published passports only. |
| F5 | Scholarship: apply, apply again | The second application is refused; an admin decision notifies the student. |
