# Roystian Demo — Test Plan

A step-by-step walkthrough of the Roystian Foundation virtual internship
platform. Every step pairs an **action** with the **result you should see**.

**Run the sections in order** — later tests depend on state created by earlier
ones.

| | |
| --- | --- |
| **Test environment** | https://roystian-foundation-ten.vercel.app |
| **Local alternative** | `npm install && npm run dev` → http://localhost:3000 |
| **Estimated time** | 35–45 minutes for a full pass |
| **Prerequisites** | A modern browser. Nothing to install. |
| **Test data** | Seeded demo records, stored in your browser |

---

## Before you begin

> **Start from a clean state.** This demo stores everything in your browser's
> local storage rather than on a server. For a true first-run experience, open
> the site in a **private / incognito window**, or clear site data first. If you
> have tested before, use *Reset demo data* (Test 14, step 8).

> **Your results are private to your browser.** Two people testing at the same
> time will not see each other's registrations, submissions or certificates.
> That is expected — this is a demo, not a shared backend.

### Demo accounts

All three are listed on the login page with one-click sign-in buttons, so you
never need to type them.

| Role | Email | Password | Who they are |
| --- | --- | --- | --- |
| Student | `student@roystian.demo` | `student123` | Rahul Sharma — AI/ML internship, part-way through |
| Admin | `admin@roystian.demo` | `admin123` | Full programme administration and analytics |
| Trainer | `trainer@roystian.demo` | `trainer123` | Aarav Mehta — a restricted view of the admin area |

### Contents

| | | | |
| --- | --- | --- | --- |
| [01 Public site tour](#test-01--public-site-tour) | [06 Module assessments](#test-06--module-assessments) | [11 Admin drives completion](#test-11--admin-drives-completion) | [16 Responsive layout](#test-16--responsive-layout) |
| [02 Onboarding](#test-02--onboarding--personalisation) | [07 Practical task](#test-07--practical-task) | [12 Certificate earned](#test-12--certificate-earned) | [17 Dark mode & a11y](#test-17--dark-mode--accessibility) |
| [03 Registration & payment](#test-03--registration--simulated-payment) | [08 Final assessment](#test-08--final-assessment) | [13 Public verification](#test-13--public-verification) | [18 Errors & protection](#test-18--errors--protected-routes) |
| [04 Student dashboard](#test-04--student-dashboard) | [09 Certificate lock rule](#test-09--the-certificate-lock-rule) | [14 Admin management](#test-14--admin-management) | [What is simulated](#what-is-simulated-on-purpose) |
| [05 Learning modules](#test-05--learning-modules) | [10 Admin console](#test-10--admin-console) | [15 College enquiry](#test-15--college-enquiry) | [Sign-off](#acceptance-checklist) |

---

## Test 01 — Public site tour
*No login required.* Confirm the marketing site is complete, accurate and free of dead links.

1. **Open the test environment home page.**
   → Headline "Start Your Virtual Internship From Anywhere." with two buttons: *Start My Internship* and *Explore Programs*. No price appears anywhere in the first screen.
2. **Scroll the full home page to the footer.**
   → Sections in order: degree-vs-experience, student journey timeline, domains, programme options, comparison table, practical learning, certificate verification, industry-led, colleges, PehlaChance, about, FAQ, final call to action.
3. **Click every link in the top navigation and the footer.**
   → Every link resolves to a real page. No 404s, no placeholder text.
4. **Go to Domains and count the entries.**
   → 12 domains, grouped under Technology, Data, Business, Engineering and Impact.
5. **Open the AI / ML domain page.**
   → Who it is for, what you will learn, a 10-module curriculum, the practical activity ("Analyse the provided dataset…"), three experience levels and both programmes.
6. **Open a second domain, e.g. Java Development.**
   → A different 10-module curriculum and a different practical activity, plus a *Demo curriculum* label because that track is illustrative rather than documented.
7. **Go to Programs and read the comparison table.**
   → Self-Paced ₹1,500 and Industry-Led ₹5,000. Video lessons, live sessions, mentor interaction, the guided project, career guidance and PehlaChance are all marked as Industry-Led only.
8. **Open the FAQ and read the placement answer.**
   → "No guaranteed placement is promised." No page anywhere claims jobs, placements or accreditation.

## Test 02 — Onboarding & personalisation
*No login required.* The seven-step flow that turns a visitor into an enrolled student.

1. **Click 🎓 Start My Internship.**
   → The profile step, with a progress indicator showing all seven stages and step 01 active.
2. **Click Continue without filling anything in.**
   → Inline validation messages under each required field. The form does not advance.
3. **Enter an invalid email such as `not-an-email`, then correct it.**
   → "Enter a valid email address." appears, then clears once the value is valid.
4. **Fill in your details, choose an education level, and continue.**
   → You land on the domain step and the progress indicator marks Profile complete.
5. **Type `data` into the domain search box.**
   → The grid filters live. Clearing the box restores all 12 domains.
6. **Select AI / ML and continue to the experience step.**
   → The selected card is visibly marked, and the next screen shows your chosen domain with a *Change* link.
7. **Choose Beginner.**
   → A "Your Recommended Learning Track" panel appears immediately, reading education level → domain → experience, and naming the *AI / ML Beginner Track* with difficulty, estimated effort, module count, assessment style and practical activity.
8. **Switch to Advanced / Experienced, then back to Beginner.**
   → The recommendation updates each time — difficulty, effort and assessment style all change.
9. **Use your browser's back button to revisit the profile step.**
   → Your entries are still there. Progress is saved as you go.

## Test 03 — Registration & simulated payment
*No login required.*

> **No real money moves.** The gateway is a simulation. Card, UPI and bank
> fields are pre-filled with demo values and nothing is transmitted or stored.

1. **On the programme step, click Compare Programs.**
   → A modal with the full feature matrix. Close it with the X or the Escape key.
2. **Choose Industry-Led (₹5,000).**
   → The checkout page, with your details pre-filled from onboarding.
3. **Read the order summary on the right.**
   → Domain, programme, experience, duration, ₹5,000 fee, *PehlaChance (1 month) — FREE*, and a ₹5,000 total.
4. **Click through UPI, Debit / Credit Card and Net Banking.**
   → The field set below changes for each method — UPI ID, card number / expiry / CVV, or a bank picker.
5. **Tick "Simulate a failed payment", then click the pay button.**
   → A processing dialog, then a red failure message stating no amount has been charged. You stay on checkout and can retry.
6. **Untick the failure box and click PAY ₹5,000 & START MY INTERNSHIP.**
   → "Securely processing your payment…" with three steps completing in sequence, then the success page.
7. **Read the success page and note the registration ID.**
   → "✓ Payment Successful", a registration ID in the form `RF-AIML-2026-000xxx`, plus domain, programme, start date and amount.
8. **Watch the automated communications panel.**
   → Four items tick green in sequence: confirmation email sent, WhatsApp confirmation sent, dashboard activated, programme team notified.
9. **Read the closing line of the panel.**
   → It states the certificate is *not* issued yet and lists what still has to be completed. This is the core product rule.

## Test 04 — Student dashboard
*Signed in as the student you just created.*

1. **Click GO TO MY DASHBOARD.**
   → A greeting using your first name, and your AI/ML internship with its registration ID.
2. **Check the four summary tiles.**
   → Modules 0/10, Assessments 0/10, Practical task "Pending", Final assessment "Pending — 70% to pass".
3. **Read the Certificate Progress panel.**
   → "Certificate Locked", a percentage, and five requirements with only *Profile completed* ticked. Each unmet requirement has a *Go* link.
4. **Open the bell icon in the top bar.**
   → A notification for your registration. Clicking one marks it read and the unread badge count drops.
5. **Open My Internship from the sidebar.**
   → Enrolment details, what you will learn, the 15-day structure, your assigned trainer marked *Demo profile*, and the PehlaChance panel.
6. **Open Schedule.**
   → A 15-day timetable with dates, topics, trainer, times and statuses — because you chose Industry-Led. (Self-Paced students see "Self-paced — no live schedule" instead.)
7. **Refresh the browser.**
   → You stay signed in and all progress is intact.

## Test 05 — Learning modules
*Student.*

1. **Open Learning in the sidebar.**
   → Ten module cards, each showing estimated reading time, resource count and assessment state. Module 01 is marked as the next one.
2. **Open Module 01 — Introduction to Artificial Intelligence.**
   → A module reader with a contents list, reading progress and the learning material, plus learning objectives, a notes box, and a sidebar holding the assessment, resources and key concepts. There is no video player.
3. **Press play, then pause, scrub the progress bar, and change volume.**
   → The timer runs, the "now covering" caption changes as you scrub, and every control responds. Fullscreen works too.
4. **Read the learning material section.**
   → Real subject content — a module overview, what you should be able to do, a definition for each key concept, and how the module is assessed.
5. **Type into the notes box, then click elsewhere.**
   → The note saves automatically. Navigate away and back — it is still there.
6. **Click Mark Module Complete.**
   → A confirmation toast naming the next module. The button becomes *Mark incomplete*, so the action is reversible.
7. **Use the module navigation at the bottom, then return to Learning.**
   → Module 01 now shows *Completed* and the progress bar reads 1 of 10.

## Test 06 — Module assessments
*Student.* The pass mark is 70%. Try failing deliberately first.

1. **Open Assessments in the sidebar.**
   → Ten module assessments plus a highlighted final assessment panel marked *Demo Assessment*.
2. **Start the Module 01 assessment.**
   → "Question 1 of 5", a progress bar, the question type, the 70% pass mark, and a numbered question navigator below.
3. **Read the questions. Check the options are real subject matter.**
   → Definition-matching questions where every option is a genuine definition from the domain — not obvious filler.
4. **Use Next, Previous and the numbered navigator.**
   → Answers are retained as you move. Answered questions are marked in the navigator, and the "x of 5 answered" counter updates.
5. **Answer deliberately badly and click Submit Assessment.**
   → A confirmation dialog first. It warns you if questions are unanswered.
6. **Confirm the submission.**
   → "Needs Improvement" with your score and percentage, then a full review showing the correct answer, your answer, and an explanation for every question.
7. **Click Retake assessment and answer correctly.**
   → "Passed" with your new score. Retakes are unlimited and the best score is kept.
8. **Find a "select every statement" question and tick only one correct option.**
   → A partially correct multi-select scores zero for that question. All required options must be selected.
9. **Return to Learning.**
   → Passing the assessment also marked the module complete.

## Test 07 — Practical task
*Student.*

1. **Open Assignments in the sidebar.**
   → The AI/ML practical task: analyse the provided dataset and explain three key observations, with numbered requirements, the deliverable and the evaluation criteria.
2. **Click Submit task with the response box empty.**
   → An error asking for a written response of at least 80 characters, or an attached file. Nothing is submitted.
3. **Switch to the Upload file tab and attach any file.**
   → A brief upload simulation, then the file name appears with a remove button. A note states only the file name is recorded in this demo.
4. **Switch back to Text response, write a few sentences, and submit.**
   → A success toast, and the status badge changes from *Pending* to *Submitted* with a timestamp.
5. **Go back to the dashboard.**
   → The practical task requirement is now ticked in the certificate progress panel, and the overall percentage has risen.

## Test 08 — Final assessment
*Student.*

1. **Open Assessments and start the final assessment.**
   → 10 questions, clearly labelled *Demo Assessment*, with a note that the live programme uses 25–50 questions.
2. **Check where the questions come from.**
   → One question drawn from each of the ten modules, so the assessment covers the whole track.
3. **Complete and submit it.**
   → A score, a pass or fail against 70%, and a full answer review. Passing shows "Final Assessment Passed".
4. **If you did not reach 70%, retake it using the explanations.**
   → The final assessment requirement ticks on your dashboard once you pass.

## Test 09 — The certificate lock rule
*Student.* The most important behaviour in the product: paying starts an internship, it does not complete one.

1. **Open Certificate in the sidebar.**
   → "Certificate Locked" — because you have finished only a couple of modules, even though payment succeeded.
2. **Read the wording on the locked panel.**
   → It states plainly that paying starts the internship but does not complete it.
3. **Check the requirement list beside it.**
   → Exactly five requirements, each with its own status and a link: profile, modules, module assessments, practical task, final assessment.
4. **Confirm there is no way to download or view a certificate.**
   → No download, print or share control is available while the certificate is locked.

> **Shortcut ahead.** Finishing all ten modules and ten assessments by hand takes
> a while. Test 11 uses the admin console to complete them for you, which also
> demonstrates that admin changes flow through to the student in real time.

## Test 10 — Admin console
*Admin.*

1. **Go to `/login` and click Login as Demo Admin.**
   → You land on the admin overview. Signing in as a different role does not require signing out first.
2. **Read the six headline tiles.**
   → Total students, today's registrations, revenue, completed internships, certificates issued and PehlaChance activations — including the registration you created earlier.
3. **Check the charts and hover over a data point.**
   → Registrations over time, revenue over time, domain-wise registrations, programme split and completion status, each with a working tooltip.
4. **Open Students and use the search box and the domain, programme and status filters.**
   → The table filters live and the "showing x of y" counter updates. Clearing restores the full list.
5. **Suspend a student, then reactivate them.**
   → A confirmation dialog before the change, then the status badge updates. Suspended accounts are blocked at login.
6. **Open Rahul Sharma and click through all seven tabs.**
   → Profile, Enrollment, Progress, Assessments, Assignment, Certificate and Communication — each populated with that student's real data.
7. **Open Registrations, Payments and Certificates.**
   → Full tables with filters. Certificates include the three documented IDs such as `RF-AIML-2026-000184`.

## Test 11 — Admin drives completion
*Admin.* Complete your own student from the admin side, and watch the change reach the student dashboard.

1. **In Students, open the student you created in Test 03.**
   → Their detail page, with the overall progress bar matching the student dashboard.
2. **Open the Progress tab and click Mark all modules complete.**
   → All ten modules and all ten module assessments are marked complete, and the progress bar jumps.
3. **Toggle an individual module back to incomplete, then complete it again.**
   → Each module can be changed independently.
4. **Click Toggle final assessment pass if the final is not already passed.**
   → The Assessments tab now shows a passing final score.
5. **Open the Assignment tab and read the submission from Test 07.**
   → Your exact text, with the submitted timestamp.
6. **Click Approve.**
   → The status changes to Approved with reviewer feedback attached.
7. **Open the Certificate tab.**
   → All five requirements now read "Done".
8. **Open Assignments in the admin sidebar and review a different student's submission as Needs revision.**
   → A review dialog with the full submission and a feedback box. The status updates and the student is notified.

## Test 12 — Certificate earned
*Student.*

1. **Sign back in as your student (or Login as Demo Student if you completed Rahul instead).**
   → The dashboard now reads 100% complete.
2. **Check the certificate progress panel.**
   → "Certificate Earned" with all five requirements ticked and a *VIEW CERTIFICATE* button.
3. **Open Certificate.**
   → A toast confirming the certificate was issued, a new certificate ID, and the full certificate document rendered on screen.
4. **Inspect the certificate itself.**
   → Roystian Foundation heading, your name, the domain, programme type, duration, issue date, certificate ID, a QR code and a verification URL.
5. **Click Print Certificate (or Download).**
   → The print preview shows only the certificate on A4 landscape — no sidebar, no navigation. Choose *Save as PDF* to keep a copy.
6. **Click Share on LinkedIn.**
   → A dialog with ready-to-paste post text including the certificate ID and verification link, plus a copy button. Nothing posts automatically.
7. **Scan the QR code with your phone, or copy the certificate ID.**
   → The QR opens the public verification page for that certificate on the live site.

## Test 13 — Public verification
*No login required.* Anyone — an employer, a college — can check a certificate without an account.

1. **Open `/verify` from the main navigation.**
   → A certificate ID field, an explanation of what verification shows, and three demo IDs you can click.
2. **Verify `RF-AIML-2026-000184`.**
   → "✓ Certificate Verified" with student Ananya Singh, the programme, domain, duration, issuer, certificate ID, issue date, a verification timestamp and a QR code.
3. **Verify your own certificate ID from Test 12.**
   → Your name and your track, verified.
4. **Enter a made-up ID such as `RF-XX-2026-999999`.**
   → "Certificate Not Found" with the ID you entered and guidance on the expected format — not a crash or a blank page.
5. **As admin, revoke your certificate, then re-open its verification page.**
   → "Certificate Revoked" with a warning that it should not be treated as valid. Restoring it returns the page to verified.
6. **Open a verification link in a private window where you are not signed in.**
   → It works exactly the same. Verification never requires a login.

## Test 14 — Admin management
*Admin.*

1. **Open Programs and edit the Self-Paced programme.**
   → The edit dialog saves, the card updates, and a *Reset* control appears to restore the published values.
2. **Click Create Program and add one, then delete it.**
   → The new programme appears marked *Custom*, can be activated and deactivated, and deletion asks for confirmation.
3. **Open Domains, expand a module list, and edit a domain description.**
   → All 12 domains with their modules, editable descriptions and practical briefs, and active/inactive toggles.
4. **Open Trainers, then open one trainer's Profile.**
   → A dedicated profile page with assigned domains, cohort size, certified count, upcoming sessions and cohort students — all labelled demo data.
5. **Open Payments and mark a successful payment as refunded.**
   → A confirmation dialog, then the payment and its registration both show *Refunded*.
6. **Open Communications.**
   → The three automated flows (payment success, programme approaching, programme completed) and a searchable log containing the messages triggered by your own registration.
7. **Open Analytics.**
   → Six headline figures, four charts and a domain performance table with certification rates.
8. **Open Settings, export the dataset, then use Reset demo data.**
   → A JSON file downloads. Reset asks for confirmation, then restores the seeded state — your test registration and certificate are gone.

> **Reset last.** Step 8 wipes the data you created in Tests 03–12. Run it only
> when you have finished with that student.

## Test 15 — College enquiry
*No login required.*

1. **Open For Colleges and read the four offerings.**
   → Internship drives, technology workshops, career sessions and employability programmes, each with detail points.
2. **Submit the enquiry form empty.**
   → Validation on every required field, including the two dropdowns.
3. **Fill it in properly and submit.**
   → "Thank you. Our team will contact you." with the option to submit another.
4. **Sign in as admin and open College Leads.**
   → Your enquiry at the top of the list. Changing its status from New to Contacted saves immediately.
5. **Open `/college-internships` — the page behind a campus poster QR code.**
   → A conversion-focused page: "Internships Are Open", both prices, a domain picker and a prominent start button.

## Test 16 — Responsive layout
*All roles.* Test on a real phone if you can, otherwise use your browser's device toolbar at 390, 768, 1024 and 1440 pixels.

1. **Load the home page at 390px and scroll to the bottom.**
   → No sideways scrolling anywhere. The student journey switches from a horizontal to a vertical timeline.
2. **Open the mobile menu from the hamburger icon.**
   → A full-height menu with every navigation link, the primary action and a theme control. It closes when you navigate.
3. **View the programme comparison table on mobile.**
   → It scrolls horizontally inside its own container while the page itself does not.
4. **Open the student dashboard on mobile.**
   → A fixed bottom navigation bar with the five main destinations, plus the full menu behind the hamburger.
5. **Open the admin students table on mobile.**
   → Table rows become stacked cards with labelled values — no pinch-zooming required.
6. **Repeat a few pages at 768px and 1024px.**
   → Layouts reflow cleanly at each size, with no clipped or overlapping content.

## Test 17 — Dark mode & accessibility
*All roles.*

1. **Click the sun icon in the header and choose Dark.**
   → The whole site switches theme instantly, with readable text everywhere.
2. **Navigate through several pages, including the admin charts, then refresh.**
   → Dark mode persists across pages and reloads. Charts, badges and tables all remain legible.
3. **Choose System and change your operating system theme.**
   → The site follows your system setting.
4. **Press Tab repeatedly from the top of the home page.**
   → A "Skip to content" link appears first, then focus moves through every interactive element with a clearly visible focus ring.
5. **Complete an assessment question using only the keyboard.**
   → Options are reachable and selectable, dialogs trap focus, and Escape closes them.
6. **Enable "Reduce motion" in your operating system and reload.**
   → Animations stop. Content still appears correctly — nothing stays invisible.

## Test 18 — Errors & protected routes
*All roles.*

1. **Visit a made-up address such as `/no-such-page`.**
   → A branded 404 page with useful links, not a raw error.
2. **Visit `/internships/not-a-domain`.**
   → The same 404 page.
3. **Sign out, then try to open `/dashboard` directly.**
   → Redirected to the login page, and the address keeps your intended destination so you return there after signing in.
4. **While signed out, try to open `/admin`.**
   → Redirected to login. No admin data is visible at any point.
5. **Sign in as the student, then try `/admin` again.**
   → You are sent back to the student dashboard. Students cannot reach the admin area.
6. **Sign in as the trainer account.**
   → A reduced admin navigation — overview, students, assignments, trainers and settings only.
7. **Try signing in with a wrong password, and with an unknown email address.**
   → Two distinct, clear messages: incorrect password, and no account found.
8. **Open your browser's developer console and repeat a few journeys.**
   → No errors or warnings logged.

---

## What is simulated on purpose

These are deliberate demo behaviours, not defects. Please do not raise them as bugs.

| Area | Behaviour in the demo |
| --- | --- |
| Data storage | Everything lives in your browser. Nothing is shared between people or devices, and clearing site data resets it. |
| Payments | No gateway is connected. No money moves and no card details are transmitted or stored. |
| Email & WhatsApp | Messages are written to the admin communication log instead of being sent. |
| Video | The Self-Paced track has no video lessons. No video files ship with the demo. |
| Resources | Downloadable handbooks, datasets and worksheets are placeholders. |
| File uploads | Only the file name is recorded; the file itself is not stored. |
| Trainers | All trainer profiles are fictional personas, labelled as demo data. |
| Certificate download | Uses the browser print dialog. Choose "Save as PDF". |
| Demo passwords | Shown on the login page deliberately so reviewers can try every role. |
| Admin catalogue edits | Programme, domain and trainer edits apply across the admin catalogue; public marketing pages show the published catalogue. |

---

## Acceptance checklist

The demo passes when every line below is true.

- [ ] A visitor can go from the home page to an enrolled dashboard without help.
- [ ] All 12 domains have real curricula, assessments and a practical activity.
- [ ] The simulated payment produces a registration ID and activates the dashboard.
- [ ] Assessments score correctly against the 70% threshold and allow retakes.
- [ ] The certificate stays locked until all five requirements are met.
- [ ] The earned certificate prints cleanly and carries a working QR code.
- [ ] Public verification works without a login, and reports revoked certificates as revoked.
- [ ] Admin changes appear on the student dashboard immediately.
- [ ] Student and admin areas are both protected from the wrong role.
- [ ] Every page works at 390px and in dark mode, with no console errors.
- [ ] No page promises jobs, placements or accreditation.

### Reporting an issue

Include the test number and step, the page address, the role you were signed in
as, your screen width, and what you saw instead of the expected result. A
screenshot helps. Check the [simulated behaviours](#what-is-simulated-on-purpose)
table first.

---

### Automated checks

The repository also ships automated verification you can run yourself:

```bash
npm run verify      # 36 assertions over the scoring, completion and seed logic
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run build       # production build
```

---

*Roystian Foundation — Virtual Internship & Skill Development Platform.
Demonstration environment. All students, registrations, payments, trainers and
certificates shown by default are fictional demo data.*
