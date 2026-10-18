import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { Hero } from "@/components/site/hero";
import { ExplainerVideo } from "@/components/site/explainer-video";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { ParallaxImage, StaticImage } from "@/components/motion/parallax-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { Magnetic } from "@/components/motion/magnetic-button";
import { SectionHeading, StepMarker } from "@/components/site/section";
import { DomainExplorer } from "@/components/site/domain-explorer";
import { ProgramCard } from "@/components/site/program-card";
import {
  ComparisonTable,
  CompareProgramsButton,
} from "@/components/site/program-comparison";
import { JourneyTimeline } from "@/components/site/journey-timeline";
import { LearningFlow } from "@/components/site/learning-flow";
import { FifteenDayTimeline } from "@/components/site/fifteen-day-timeline";
import { CertificatePreview } from "@/components/site/certificate-preview";
import { FaqAccordion } from "@/components/site/faq-section";
import { VerifyWidget } from "@/components/site/verify-widget";
import {
  AdvancedOpportunitySection,
  AudienceGrid,
  CareerPassportSection,
  CareerReadinessSection,
  ImpactTrustSection,
  StudentProblem,
} from "@/components/site/v2-sections";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { IMAGES } from "@/lib/images";
import {
  ABOUT_PILLARS,
  COLLEGE_OFFERINGS,
  HOW_IT_WORKS,
} from "@/data/content";

export default function HomePage() {

  return (
    <SiteShell bleed>
      <Hero />

      {/* ── Roystian Foundation in one minute (explainer video) ─────── */}
      <section id="introduction" className="section border-b border-border" aria-labelledby="introduction-title">
        <div className="container grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Roystian Foundation in one minute
            </p>
            <h2 id="introduction-title" className="h2 mt-3">
              See what the programme is about.
            </h2>
            <p className="lede mt-4 max-w-xl">
              A one-minute walkthrough of how it works: choose a career domain, learn through
              structured modules, prove your skills with assessments and a practical task, and
              earn a certificate anyone can verify.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                { icon: GraduationCap, title: "Choose your career domain", body: "Twelve domains, from AI/ML to sustainability." },
                { icon: ClipboardCheck, title: "Learn, practise and get assessed", body: "Modules, assessments and a practical task you complete yourself." },
                { icon: BadgeCheck, title: "Earn a verifiable certificate", body: "Issued when the work is done, never just on payment." },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{title}</span>
                    <span className="block text-sm text-muted-foreground">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/start">
                  Start My Internship <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ExplainerVideo />
          </Reveal>
        </div>
      </section>

      {/* ═══ 01 · The Student Problem ════════════════════════════════ */}
      <section className="section border-b border-border">
        <div className="container">
          <StudentProblem />
        </div>
      </section>

      {/* ── Who this is for ──────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="One website, multiple experiences"
            title="Whoever you are, start here."
            description="The platform answers five different questions. Pick the one that is yours."
          />
          <div className="mt-12">
            <AudienceGrid />
          </div>
        </div>
      </section>

      {/* ═══ Journey 01 · Discover ═══════════════════════════════════ */}
      <section id="journey" className="section border-b border-border">
        <div className="container">
          <Reveal>
            <StepMarker index={1} total={7} label="Discover" />
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <SplitHeading
                lines={[
                  "Your degree gives you knowledge.",
                  "Experience builds your career.",
                ]}
                className="display-sm max-w-[16ch] text-foreground"
                accentLine={1}
              />
              <Reveal delay={0.1}>
                <p className="lede mt-6 max-w-xl">
                  Roystian Foundation creates practical learning and internship
                  opportunities that help students bridge the gap between academic
                  education and industry expectations.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Every track is built the same way: structured concepts first, then
                  applied practice, then assessment, then a practical activity that
                  mirrors real work. The certificate is the record of that work — not
                  a receipt for a payment.
                </p>
                <Link
                  href="/how-it-works"
                  className="link-underline mt-6 inline-flex min-h-[2.75rem] items-center text-sm font-semibold text-primary"
                >
                  See how it works
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>

            <Reveal preset="imageReveal" delay={0.05}>
              <ParallaxImage
                image={IMAGES.studentJourney}
                strength={9}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch aspect-[4/5] w-full border border-border sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </Reveal>
          </div>

          <Reveal className="mt-20">
            <JourneyTimeline />
          </Reveal>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="How It Works"
            title="Four steps, in the same order, every time."
            description="No hidden stages and no surprises about what the certificate requires."
          />
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <Reveal key={item.step} child>
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ Journey 02 · Choose your domain ═════════════════════════ */}
      <section id="domains" className="section border-b border-border">
        <div className="container">
          <Reveal>
            <StepMarker index={2} total={7} label="Choose your domain" />
          </Reveal>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              animate
              title="Pick the field you want to work in."
              description="Every track is built around the same completion standard — the subject is what changes."
            />
            <Reveal delay={0.08}>
              <Button asChild variant="outline" className="group shrink-0">
                <Link href="/domains">
                  All 12 domains <ArrowRight className="cta-arrow" />
                </Link>
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.05} className="mt-12">
            <DomainExplorer domains={DOMAINS} />
          </Reveal>
        </div>
      </section>

      {/* ═══ Journey 03 · Choose how you learn ═══════════════════════ */}
      <section id="programs" className="section border-b border-border bg-muted/30">
        <div className="container">
          <Reveal>
            <StepMarker index={3} total={7} label="Choose how you learn" />
          </Reveal>
          <SectionHeading
            animate
            align="center"
            className="mt-8"
            title="Choose how you want to learn."
            description="Both programmes end in the same verifiable certificate. What differs is how much guidance you get on the way there."
          />

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
            {PROGRAMS.map((program, index) => (
              <Reveal key={program.id} delay={index * 0.08}>
                <ProgramCard program={program} href="/start" />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <CompareProgramsButton />
          </Reveal>

          <Reveal delay={0.05} className="mt-16">
            <ComparisonTable />
          </Reveal>
        </div>
      </section>

      {/* ═══ Journey 04 · Learn — the self-paced track ═══════════════ */}
      <section className="section border-b border-border">
        <div className="container">
          <Reveal>
            <StepMarker index={4} total={7} label="Learn" />
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <Reveal preset="imageReveal">
              <ParallaxImage
                image={IMAGES.selfPacedLearning}
                strength={8}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch-r aspect-[5/4] w-full border border-border"
              />
            </Reveal>

            <div>
              <SectionHeading
                animate
                eyebrow="Self-Paced · ₹1,500"
                title="Read it, practise it, prove it."
                description="The self-paced track is content based. You get structured written material, resources and assessments — no video lessons, no fixed schedule, no waiting for anyone."
              />
              <Reveal delay={0.08}>
                <ul className="mt-7 space-y-3 text-sm">
                  {[
                    "Every module opens with objectives and key concepts, then the material itself.",
                    "Handbooks, worksheets, checklists and datasets sit alongside each module.",
                    "Assessments are open from day one and can be retaken as often as you need.",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed text-muted-foreground">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-[0.82rem] leading-relaxed text-muted-foreground">
                  Video lessons, live sessions, mentor interaction, the guided project
                  and career guidance are part of the{" "}
                  <Link
                    href="/programs"
                    className="font-medium text-primary hover:underline"
                  >
                    ₹5,000 Industry-Led programme
                  </Link>
                  .
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal className="mt-16">
            <LearningFlow />
          </Reveal>
        </div>
      </section>

      {/* ═══ Journey 05 · Practise ═══════════════════════════════════ */}
      <section className="surface-ink section relative overflow-hidden border-b border-white/10">
        <ParallaxImage
          image={IMAGES.practicalProject}
          alt=""
          strength={10}
          sizes="100vw"
          className="absolute inset-0 opacity-[0.22]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink-surface via-ink-surface/90 to-ink-surface/60"
          aria-hidden="true"
        />

        <div className="container relative">
          <Reveal>
            <StepMarker index={5} total={7} label="Practise" tone="invert" />
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <SplitHeading
                lines={["Don't just learn.", "Build something."]}
                className="display-sm max-w-[14ch] text-white"
                accentLine={1}
                accentClassName="text-white/55"
              />
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75">
                  Every domain carries a practical activity drawn from how the work is
                  actually done. It is submitted, reviewed, and required before the
                  certificate unlocks.
                </p>
                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: ClipboardCheck,
                      title: "Module assessments",
                      body: "A short assessment after every module, with a 70% pass threshold and up to five attempts a day.",
                    },
                    {
                      icon: FileCheck2,
                      title: "A real practical task",
                      body: "Analyse a dataset, design test cases, build a component, plan a campaign — depending on your domain.",
                    },
                    {
                      icon: Lock,
                      title: "The certificate stays locked",
                      body: "Until modules, assessments, the practical task and the final assessment are all complete.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                        <item.icon
                          className="h-[1.1rem] w-[1.1rem]"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <h3 className="text-[0.95rem] font-semibold text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/65">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Stagger className="grid gap-4 self-center sm:grid-cols-2">
              {DOMAINS.slice(0, 4).map((domain) => (
                <Reveal key={domain.id} child>
                  <div className="h-full rounded-2xl border border-white/12 bg-white/[0.04] p-5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                        <DynamicIcon name={domain.icon} className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-white">
                        {domain.shortName}
                      </p>
                    </div>
                    <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Practical activity
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                      {domain.practicalTask.brief}
                    </p>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ── Industry-Led: the 15-day structure ───────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <SectionHeading
                animate
                eyebrow="Industry-Led · ₹5,000"
                title="Fifteen days, with people who do this work."
                description="The guided track adds a fixed schedule, live sessions run by working professionals, mentor interaction, a guided project and career guidance."
              />
              <Reveal delay={0.08} className="mt-7">
                <div className="flex flex-col gap-5 rounded-2xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Sessions are led by practitioners working in each domain.
                  </p>
                  <Button asChild variant="outline" className="group shrink-0">
                    <Link href="/programs">
                      <CalendarDays /> See the structure
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal preset="imageReveal" delay={0.05}>
              <StaticImage
                image={IMAGES.industryLedMentor}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="aspect-[5/4] w-full rounded-2xl border border-border"
              />
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <FifteenDayTimeline />
          </Reveal>
        </div>
      </section>

      {/* ═══ Journey 06 · Certify ════════════════════════════════════ */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <Reveal>
            <StepMarker index={6} total={7} label="Get certified" />
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <div>
              <SplitHeading
                lines={["Earn something", "you can prove."]}
                className="display-sm max-w-[14ch] text-foreground"
                accentLine={1}
              />
              <Reveal delay={0.1}>
                <p className="lede mt-6 max-w-lg">
                  Every certificate carries a unique ID and a QR code that resolves to
                  a public verification page. No login, no PDF to email around.
                </p>
                <ul className="mt-7 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Name, domain, programme and issue date shown on verification",
                    "Revoked certificates are reported as revoked, not as valid",
                    "The QR code resolves against the live site origin",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="group mt-8">
                  <Link href="/verify">
                    Verify a certificate <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
              </Reveal>
            </div>

            <CertificatePreview />
          </div>

          {/* Verification, as its own moment. */}
          <Reveal className="mt-20">
            <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-2">
              <StaticImage
                image={IMAGES.certificateVerification}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="min-h-[16rem] lg:min-h-0"
              />
              <div className="p-7 sm:p-9">
                <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">
                  Check a certificate right now
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Enter a certificate ID exactly as it appears on the document, or scan
                  the QR code printed on it.
                </p>
                <div className="mt-6">
                  <VerifyWidget />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Journey 07 · Move forward ═══════════════════════════════ */}
      <section className="section border-b border-border">
        <div className="container">
          <Reveal>
            <StepMarker index={7} total={7} label="Move forward" />
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <SplitHeading
                lines={["Your internship ends.", "Your career journey doesn't."]}
                className="display-sm max-w-[16ch] text-foreground"
                accentLine={1}
              />
              <Reveal delay={0.1}>
                <Badge className="mt-6">
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> Included with
                  Industry-Led
                </Badge>
                <p className="lede mt-4 max-w-lg">
                  Industry-Led students receive one month of PehlaChance access at no
                  additional cost — a place to keep a professional profile and follow
                  opportunities after the programme.
                </p>
                <Stagger className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: GraduationCap, label: "Internships" },
                    { icon: Building2, label: "Jobs" },
                    { icon: Users, label: "Professional profile" },
                    { icon: ArrowRight, label: "Career opportunities" },
                  ].map((item) => (
                    <Reveal key={item.label} child>
                      <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30">
                        <item.icon
                          className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </div>
                    </Reveal>
                  ))}
                </Stagger>
                <Button asChild size="lg" className="group mt-8">
                  <Link href="/pehlachance">
                    Explore PehlaChance <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
                <p className="mt-5 max-w-lg text-xs text-muted-foreground">
                  PehlaChance is an opportunity platform. No placement, interview or
                  hiring outcome is promised.
                </p>
              </Reveal>
            </div>

            <Reveal preset="imageReveal" delay={0.05}>
              <ParallaxImage
                image={IMAGES.careerOpportunities}
                strength={9}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch-r aspect-[4/5] w-full border border-border sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── For colleges ─────────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <Reveal preset="imageReveal">
              <StaticImage
                image={IMAGES.collegePartnership}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch aspect-[5/4] w-full border border-border"
              />
            </Reveal>

            <div>
              <SectionHeading
                animate
                eyebrow="For Colleges"
                title="Build career-ready students with us."
                description="Run internship drives, workshops and employability programmes for an entire batch, with visibility into progress."
              />
              <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                {COLLEGE_OFFERINGS.map((offering) => (
                  <Reveal key={offering.id} child>
                    <div className="lift-card h-full rounded-2xl border border-border bg-card p-5 shadow-soft">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                        <DynamicIcon
                          name={offering.icon}
                          className="h-[1.05rem] w-[1.05rem]"
                        />
                      </span>
                      <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                        {offering.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {offering.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </Stagger>
              <Reveal delay={0.1} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group">
                  <Link href="/colleges">
                    <Building2 /> Partner With Us <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/college-internships">College programme</Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Foundation ───────────────────────────────────────────── */}
      <section className="section overflow-hidden border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="About Roystian Foundation"
            title="A Section 8 non-profit working across technology, education and impact."
            description="Developing technologies, research initiatives, career solutions and social innovations that address real-world challenges."
          />
        </div>

        <Reveal preset="fadeIn" className="mt-12">
          <ParallaxImage
            image={IMAGES.foundationCampus}
            strength={12}
            sizes="100vw"
            className="h-[38vh] min-h-[16rem] w-full sm:h-[46vh]"
          />
        </Reveal>

        <div className="container">
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT_PILLARS.map((pillar) => (
              <Reveal key={pillar.title} child>
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <DynamicIcon
                      name={pillar.icon}
                      className="h-[1.1rem] w-[1.1rem]"
                    />
                  </span>
                  <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {pillar.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>

          <Reveal delay={0.08} className="mt-10">
            <Button asChild variant="outline" className="group">
              <Link href="/about">
                Read more about the Foundation{" "}
                <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            animate
            eyebrow="FAQ"
            title="Questions students ask before starting."
            description="If something is not covered here, the programme team can help."
          />
          <Reveal delay={0.08}>
            <FaqAccordion />
          </Reveal>
        </div>
      </section>

      {/* ═══ 07 · Career Passport ═══════════════════════════════════ */}
      <section id="career-passport" className="section border-b border-border">
        <div className="container">
          <CareerPassportSection />
        </div>
      </section>

      {/* ═══ 08 · Career Readiness ══════════════════════════════════ */}
      <section
        id="career-readiness"
        className="section border-b border-border bg-muted/30"
      >
        <div className="container">
          <CareerReadinessSection />
        </div>
      </section>

      {/* ═══ 09 · Advanced Internship Opportunities ═════════════════ */}
      <section className="surface-ink section border-b border-white/10">
        <div className="container">
          <AdvancedOpportunitySection />
        </div>
      </section>

      {/* ═══ 12 · Impact & Trust ════════════════════════════════════ */}
      <section className="section border-b border-border">
        <div className="container">
          <ImpactTrustSection />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="surface-ink relative isolate flex min-h-[70svh] items-center overflow-hidden">
        <ParallaxImage
          image={IMAGES.futureCareer}
          alt=""
          strength={14}
          priority={false}
          sizes="100vw"
          className="absolute inset-0 -z-10"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-surface/95 via-ink-surface/88 to-ink-surface/72"
          aria-hidden="true"
        />

        <div className="container relative py-24 text-center">
          <SplitHeading
            lines={[
              "Your degree opens the door.",
              "Your skills take you further.",
            ]}
            className="display mx-auto max-w-[18ch] text-white"
            accentLine={1}
            accentClassName="text-white/55"
          />
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80">
              Don&rsquo;t just collect certificates. Build something. Prove
              something. Show what you can do.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Magnetic>
                <Button asChild size="xl" className="group w-full sm:w-auto sm:px-8">
                  <Link href="/internships">
                    Explore Internships <ArrowRight className="cta-arrow" />
                  </Link>
                </Button>
              </Magnetic>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/dashboard/assessments">Take Skill Assessment</Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/colleges#partner">Partner Your College</Link>
              </Button>
            </div>
            <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-white/70">
              No guaranteed placement is promised. Certificates are issued only after
              the completion requirements are met.
            </p>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
