# Roystian Foundation — Virtual Internship & Skill Development Platform

> **Learn. Build. Get Certified. Move Forward.**

A complete, demo-ready product for the Roystian Foundation virtual internship
programme: a public marketing site, a full student onboarding and payment
journey, a learning dashboard with modules, assessments and practical tasks,
earned (never purchased) certificates with public verification, and an admin
console with analytics.

Everything runs client-side against a seeded demo database in `localStorage` —
no backend, no database, no API keys, no environment variables.

**Live demo:** <https://roystian-foundation-ten.vercel.app>
**Test plan:** [TESTING.md](./TESTING.md) — a step-by-step acceptance script with
expected results for every screen. A print-ready version is included as
[`Roystian-Demo-Test-Plan.pdf`](./Roystian-Demo-Test-Plan.pdf).

---

## Table of contents

1. [Project overview](#project-overview)
2. [Tech stack](#tech-stack)
3. [Local setup](#local-setup)
4. [Demo credentials](#demo-credentials)
5. [The end-to-end demo journey](#the-end-to-end-demo-journey)
6. [Route map](#route-map)
7. [Architecture](#architecture)
8. [Product rules encoded in the app](#product-rules-encoded-in-the-app)
9. [Verification](#verification)
10. [Vercel deployment](#vercel-deployment)
11. [Demo limitations](#demo-limitations)
12. [Future production integrations](#future-production-integrations)

---

## Project overview

Roystian Foundation is presented as a Section 8 non-profit working across
technology, education, research and community impact. This platform is its
virtual internship product.

The core idea the whole application is built around:

> **A degree gives knowledge. Experience builds a career — and a certificate
> should record work that was actually done.**

So the product is deliberately *not* "pay → receive certificate". It is:

```
Discover a domain → Learn → Practise → Assess → Complete → Earn a verifiable credential
```

**What is included**

| Area | What you get |
| --- | --- |
| Marketing site | Landing page, domains, programmes, how it works, colleges, about, PehlaChance, legal pages, FAQ |
| Onboarding | 7-step flow: profile → domain → experience → recommended track → programme → checkout → dashboard |
| Personalisation | Recommended learning track computed from education level, domain and experience |
| Payment | A full mock gateway (UPI / card / net banking) with processing states, success and failure simulation |
| Student dashboard | Overview, internship, learning modules, module reader, assessments, practical task, schedule, certificate, profile |
| Assessments | 12 domains × 10 module assessments + a final assessment per domain, auto-derived from the curriculum, scored at a 70% threshold |
| Certificates | Locked until every requirement is met; A4-landscape printable document with QR code |
| Verification | Public, login-free verification by certificate ID, including revoked-certificate handling |
| Admin console | Overview, students, registrations, programmes, domains, trainers, assignments, certificates, payments, communications, college leads, analytics, settings |
| Analytics | Recharts line/area/bar/donut charts over the live demo dataset |
| Platform | Dark mode, responsive 390→1440, accessibility, SEO metadata, sitemap, robots, OG image |

**Curriculum scale** — 12 domains, 10 modules each (120 modules), ~46 concepts
per domain, 120 module assessments and 12 final assessments, all generated
deterministically from authored curriculum content so questions are meaningful
rather than filler.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) with React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 with CSS-variable theming |
| Components | shadcn/ui-style primitives on Radix UI |
| Icons | lucide-react |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion (subtle, reduced-motion aware) |
| Toasts | Sonner |
| Theming | next-themes (class strategy, persisted) |
| QR codes | `qrcode`, wrapped behind `lib/qr.ts` |
| Persistence | `localStorage`, behind a mock service layer |

No database, no auth provider, no payment gateway, no environment variables are
required.

---

## Local setup

Authentication runs on Supabase. Locally that is the Supabase CLI stack, which
needs Docker Desktop running.

```bash
npm install
cp .env.example .env.local      # then fill in the values printed by the next step
npx supabase start              # local Postgres, Auth, Storage, Studio (first run pulls images)
npx supabase db reset           # applies supabase/migrations and supabase/seed.sql
npm run dev
```

Open <http://localhost:3000>. Supabase Studio is at <http://127.0.0.1:54323>
and local auth emails land in Mailpit at <http://127.0.0.1:54324>.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (type-checks the whole project) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Compiles and runs the logic self-test (see [Verification](#verification)) |
| `npm run test:rls` | Row level security checks against the local Supabase stack (run `npx supabase db reset` first) |

After changing the schema, regenerate types with
`npx supabase gen types typescript --local > types/supabase.ts`.

Requires Node.js 18.18+ (tested on Node 26).

### Database layout

- `supabase/migrations/` — schema, row level security, and a temporary
  `legacy_demo_id` bridge column (see below).
- `supabase/seed.sql` — **local only**: one login per role. Never run it
  against production.
- `lib/supabase/` — browser, server and service-role clients, and the
  middleware session refresh.
- `middleware.ts` — server-side route protection by role.

Every signup becomes a `student`. Staff roles (`admin`, `trainer`, `college`,
`partner`) cannot be set from the client, not even by an admin; grant them in
SQL or Studio:

```sql
update public.profiles set role = 'admin' where email = 'someone@example.org';
```

### Transition state

**On Supabase:** sign-in and roles; the whole student journey — enrolment
(`/api/enrolments`), module progress and notes, assessments (scored on the
server, `/api/assessments/submit`), practical task submissions with file
uploads to private Storage, certificate issue (`/api/certificates/issue`),
notifications, and public certificate verification.

**Still in the browser demo database (`lib/db.ts`):** the admin console,
campus and partner dashboards, and the career tools (projects, readiness,
badges, resume, interviews, challenges, fellowship, passport). Staff accounts
reach that data through the temporary `profiles.legacy_demo_id` link; drop it
once those screens move.

**Payments are still simulated.** `/api/enrolments` only runs when
`PAYMENT_MODE=simulated` (the default outside production) and refuses every
request in production until the Cashfree webhook replaces it.

| Script | What it checks |
| --- | --- |
| `npm run test:rls` | What each role can and cannot read or write |
| `npm run test:journey` | Signup → enrolment → assessments → task → certificate → verification through the real API routes (needs `npm run dev` running; set `BASE_URL` if not on :3000) |

---

## Demo credentials

Local development only. `supabase/seed.sql` creates these accounts; they do
not exist in production and are no longer shown on `/login`.

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@roystian.demo` | `student123` |
| Admin | `admin@roystian.demo` | `admin123` |
| Trainer | `trainer@roystian.demo` | `trainer123` |
| College | `college@roystian.demo` | `college123` |
| Partner | `partner@roystian.demo` | `partner123` |

The demo student is **Rahul Sharma**, enrolled in the AI/ML Industry-Led
internship at 4 of 10 modules complete — deliberately mid-journey so the locked
certificate, remaining requirements and live schedule are all visible.

Every other student, registration, payment, submission and certificate in the
app is seeded demo data, clearly labelled as such throughout the UI.

---

## The end-to-end demo journey

A reviewer can experience the entire product from the homepage without any
configuration:

```
Homepage
  → Start My Internship        (/start)
  → Profile                    name, email, mobile, education, college, course, city
  → Choose Domain              12 domains, searchable
  → Choose Experience          beginner / intermediate / advanced
  → Recommended Track          difficulty, effort, modules, assessment style, practical activity
  → Choose Programme           Self-Paced ₹1,500 vs Industry-Led ₹5,000 (+ comparison modal)
  → Checkout                   order summary, student details, UPI / card / net banking
  → Simulated payment          "Securely processing your payment…" → success
  → Payment success            registration ID (e.g. RF-AIML-2026-000184), simulated email/WhatsApp/dashboard events
  → Dashboard                  progress, next module, certificate requirements
  → Learning module            module reader (contents, reading progress), objectives, resources, notes, mark complete
  → Module assessment          single + multiple choice, 70% to pass, scored review
  → Practical task             domain-specific brief, text response or simulated upload
  → Final assessment           10 questions, labelled "Demo Assessment"
  → Completion                 all five requirements satisfied
  → Certificate                A4 printable document, QR code, LinkedIn / Instagram share composer
  → Public verification        /verify/<id> — no login required
```

**Admin journey**

```
Login as Demo Admin
  → Overview        KPIs, registrations/revenue charts, domain + programme split, completion
  → Students        filterable table → student detail (profile, enrolment, progress, assessments, assignment, certificate, communications)
  → Change progress marks modules complete / toggles the final assessment → the student dashboard updates immediately
  → Assignments     review a practical submission → Approve / Needs revision
  → Certificates    issue, verify, revoke (revocation is reflected on the public page)
  → Payments        simulate a refund
  → Analytics       full chart suite over the demo dataset
```

---

## Route map

**Public**

```
/                         /programs               /domains
/internships/[domain]     /how-it-works           /colleges
/college-internships      /about                  /pehlachance
/verify                   /verify/[certificateId] /login
/register                 /terms                  /privacy
/refund-policy            /sitemap.xml            /robots.txt
```

**Onboarding**

```
/start  /start/domain  /start/experience  /start/program  /checkout  /payment/success
```

**Student (protected)**

```
/dashboard                      /dashboard/internship
/dashboard/learning             /dashboard/learning/[moduleId]
/dashboard/assessments          /dashboard/assessments/[assessmentId]   (use `final` for the final assessment)
/dashboard/assignments          /dashboard/schedule
/dashboard/certificate          /dashboard/profile
```

**Admin (protected)**

```
/admin                 /admin/students        /admin/students/[studentId]
/admin/registrations   /admin/programs        /admin/domains
/admin/trainers        /admin/assignments     /admin/certificates
/admin/payments        /admin/communications  /admin/leads
/admin/analytics       /admin/settings
```

---

## Architecture

```
app/                      routes, layouts, metadata, sitemap, robots, OG image
components/
  ui/                     shadcn-style primitives (button, card, dialog, select, table, …)
  shared/                 logo, theme, icons, states, status badge, stat card, QR, confirm dialog
  site/                   navbar, footer, hero visual, domain/programme cards, comparison, FAQ, forms
  start/                  onboarding shell, stepper and each step
  checkout/               checkout view, mock gateway dialog, success view
  dashboard/              shell, guard, notifications, learning, module reader, assessments, certificate
  admin/                  admin shell, data table, filters, charts and every management screen
data/
  curriculum/             authored curriculum for all 12 domains (part-a…part-d)
  domains.ts              expands curriculum into modules, concepts, reading and assessments
  programs.ts             the two documented programmes and the comparison matrix
  trainers.ts             demo trainer personas
  content.ts              site copy, FAQ, journey stages, pillars, college offerings
  seed.ts                 the seeded demo database (24 students and all related records)
lib/
  storage.ts              localStorage wrapper + change notification
  db.ts                   database read/write, seeding, `useDatabase()` hook
  auth.ts                 login/logout/register, `useSession()`, demo accounts
  api.ts                  mock service facade every screen talks to
  payments.ts             registration + payment creation
  progress.ts             scoring, completion requirements, certificate unlock rules
  certificates.ts         issuing, verification, revocation
  submissions.ts          practical task submission and review
  notifications.ts        notification centre state
  communications.ts       simulated email / WhatsApp / dashboard event flows
  analytics.ts            KPI and chart derivations
  schedule.ts             15-day Industry-Led schedule generation
  recommendation.ts       recommended learning track
  random.ts               deterministic PRNG (no hydration mismatches)
types/index.ts            every data model
```

### How the data layer works

- **One JSON document** in `localStorage` (`roystian.db.v1`) holds every
  collection. It is seeded on first load from `data/seed.ts`.
- **`lib/db.ts`** exposes `getDB()`, `updateDB(mutator)` and a reactive
  `useDatabase()` hook. Any mutation notifies every subscribed component, so an
  admin action is reflected on the student dashboard immediately.
- **`lib/api.ts`** is the single seam. Every screen calls it rather than
  touching storage. Replacing the demo persistence with a real backend means
  turning each function in that file into a `fetch` — the component layer does
  not change.
- **Determinism** — anything that looks random (assessment option ordering,
  sampled final-assessment questions, seeded durations) uses a seeded PRNG in
  `lib/random.ts`, so server and client renders always agree.

### How assessments are generated

Curriculum content is authored as modules with objectives and key concepts
(`term` + `definition`). `data/domains.ts` derives, for each module:

- a **definition-matching question per concept**, with distractors drawn from
  other real definitions in the same domain, and
- a **multi-select question** that mixes correct term/definition pairs with
  deliberately swapped ones.

The final assessment samples one question per module. The result is 132
assessments whose questions actually test the material instead of being filler.

---

## Product rules encoded in the app

These are enforced in code, not just in copy:

1. **The certificate is never available on payment.** `lib/progress.ts` computes
   five requirements — profile, modules, module assessments, practical task,
   final assessment — and `generateCertificate()` returns `null` unless all five
   pass.
2. **70% is the pass threshold** for every module assessment and the final
   assessment; retakes are unlimited and the best score is kept.
3. **Self-Paced is never presented as a live programme.** It has no schedule;
   `/dashboard/schedule` states "Self-paced — no live schedule".
4. **No jobs, placements or guaranteed internships are promised** anywhere. The
   FAQ answers this explicitly, and the About page lists what is *not* claimed.
5. **No accreditation, university, government or company affiliation is claimed.**
6. **Trainer profiles are labelled demo data** wherever they appear.
7. **Demo curriculum is labelled.** Domains whose detailed curriculum is not in
   the source documentation are marked "Demo curriculum" on their public page and
   in the admin.
8. **Revoked certificates verify as revoked**, never as valid.

---

## Verification

The project ships with two levels of automated checking.

### `npm run verify`

Compiles and runs `scripts/selftest.ts`, a 36-assertion harness over the pure
logic: curriculum shape, assessment construction, scoring (including partial
multi-select answers scoring zero), seed integrity, ID formats, completion
rules, analytics derivations, schedule generation and the recommendation engine.

```
$ npm run verify
ok    12 domains
ok    every domain has 10 modules
...
ok    payment alone does not unlock the certificate
ok    completed student meets every requirement

ALL CHECKS PASSED
```

### Manual acceptance testing

[TESTING.md](./TESTING.md) is a full acceptance script: 18 numbered tests, ~130
steps, each pairing an action with the result it should produce, plus a table of
behaviours that are simulated on purpose so they are not reported as defects.

### Browser journey checks

The full product journeys were driven end to end in headless Chrome during
development: the complete student flow (onboarding → payment → dashboard →
module → assessment → practical task → certificate → public verification), the
admin flow (progress editing, submission review, certificate issue and
revocation), route protection for both roles, the college enquiry form, dark
mode, and an overflow/console sweep across 51 routes at 390 / 768 / 1024 / 1440
px. All passed with no console errors.

---

## Vercel deployment

The project is deployment-ready with no configuration.

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Or import the repository in the Vercel dashboard — the defaults are correct
(framework: Next.js, build: `npm run build`, output: `.next`).

The current deployment lives at
<https://roystian-foundation-ten.vercel.app>. Deployment Protection is disabled
on that project so the URL can be shared without a Vercel account; re-enable it
under *Project → Settings → Deployment Protection* if the demo should become
private again.

**No environment variables are required.** One is optional:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used for `sitemap.xml`, `robots.txt` and OG metadata. Falls back to `VERCEL_URL`, then `localhost`. |

Certificate QR codes and verification links are always built from
`window.location.origin` at runtime, so they resolve correctly on preview
deployments, production and localhost without any configuration.

---

## Demo limitations

Deliberate, and clearly surfaced in the UI:

- **Data lives in your browser.** Everything is stored in `localStorage`, so it
  is per-browser and per-device, and clearing site data resets it. Settings →
  *Reset demo data* restores the seeded state.
- **No real payments.** The gateway is a simulation; card, UPI and bank details
  are never transmitted or stored. A failure toggle on checkout demonstrates the
  failure path.
- **No real messages.** Email and WhatsApp events are written to the local
  communication log instead of being sent.
- **Resources are placeholders.** Module handbooks, worksheets and datasets are
  named but not downloadable, so no external or copyrighted media ships with the
  project. Learning itself is content based: the Self-Paced track carries no
  video lessons.
- **File uploads are simulated.** Only the file name is recorded.
- **Trainer profiles are fictional personas**, not real people.
- **Admin catalogue edits** (programmes, domains, trainers) are stored locally
  and shown across the admin catalogue; the public marketing pages render the
  published catalogue.
- **Demo passwords are visible** on the login page on purpose, so reviewers can
  explore every role. A production build would remove them.
- **Certificate "download" uses the browser print dialog** (choose *Save as
  PDF*), which keeps the project free of a PDF toolchain.

---

## Future production integrations

Each of these slots in behind an interface that already exists, so the UI would
not need to change:

| Concern | Today | Production |
| --- | --- | --- |
| Persistence | `lib/db.ts` over `localStorage` | Postgres / Prisma behind the same `lib/api.ts` functions |
| Auth | `lib/auth.ts` demo sessions | NextAuth / Clerk / Auth.js with server-side route protection and middleware |
| Payments | `lib/payments.ts` simulation | Razorpay or Stripe, with webhook-confirmed registration creation |
| Messaging | `lib/communications.ts` log | Transactional email (Resend / SES) and WhatsApp Business API |
| Files | Simulated upload | S3 / Vercel Blob with signed URLs and antivirus scanning |
| Video (Industry-Led only) | Not shipped | Mux / Cloudflare Stream with signed playback, for the Industry-Led programme's recorded sessions |
| Certificates | Printable HTML | Server-rendered PDF plus a signed, tamper-evident verification record |
| Verification | Client lookup | A public read-only API endpoint with rate limiting |
| Analytics | Derived in the browser | Warehouse-backed reporting with scheduled aggregation |

---

## Accessibility and performance notes

- Semantic landmarks, a skip link, labelled form controls, `aria-invalid` on
  failed validation, `role="alert"` on error messages and live regions on
  assessment results and payment progress.
- Full keyboard operation with visible focus rings; Radix primitives handle
  focus trapping in dialogs and menus.
- `prefers-reduced-motion` disables animation globally, and Framer Motion
  components fall back to static rendering.
- Marketing pages are server components; interactivity is isolated to leaf
  client components. Charts and the QR library load only on the routes that use
  them.
- Tables become cards below `md`; the comparison table scrolls horizontally
  inside its own container.

---

*This is a demonstration environment. All students, registrations, payments,
trainers and certificates shown by default are fictional demo data.*
