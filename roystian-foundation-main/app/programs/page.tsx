import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Minus } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { ParallaxImage, StaticImage } from "@/components/motion/parallax-image";
import { SectionHeading } from "@/components/site/section";
import { ProgramCard } from "@/components/site/program-card";
import { ComparisonTable } from "@/components/site/program-comparison";
import { LearningFlow } from "@/components/site/learning-flow";
import { FifteenDayTimeline } from "@/components/site/fifteen-day-timeline";
import { FaqAccordion } from "@/components/site/faq-section";
import { Button } from "@/components/ui/button";
import { PROGRAMS, getProgram } from "@/data/programs";
import { FAQS } from "@/data/content";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Compare the Self-Paced (₹1,500) and Industry-Led (₹5,000) Roystian virtual internship programmes side by side. Self-Paced is content based and does not include video lessons or live sessions.",
};

export default function ProgramsPage() {
  const programFaqs = FAQS.filter((faq) =>
    [
      "What is the difference between Self-Paced and Industry-Led?",
      "Does the ₹1,500 Self-Paced programme include video lessons?",
      "What is included in the ₹5,000 program?",
      "How does certification work?",
      "Is placement guaranteed?",
    ].includes(faq.q),
  );
  const selfPaced = getProgram("self-paced");

  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.selfPacedLearning}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Programs" }]}
        eyebrow="Program Options"
        title={["Choose how you", "want to learn."]}
        description="Both programmes cover the same learning track, the same assessments and the same practical activity, and both end in a verifiable completion certificate. The difference is how much guidance you receive."
        actions={
          <>
            <Button asChild size="xl" className="group">
              <Link href="/start">Start My Internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="#compare">See the full comparison</Link>
            </Button>
          </>
        }
        meta={[
          { label: "Self-Paced", value: "₹1,500" },
          { label: "Industry-Led", value: "₹5,000" },
          { label: "Both end in a certificate", value: "15 days" },
        ]}
      />

      {/* ── The two programmes ───────────────────────────────────────── */}
      <section className="section border-b border-border" aria-labelledby="the-programmes">
        <div className="container">
          {/* The cards carry the heading visually; screen readers still need
              one so the document outline does not jump from h1 to h3. */}
          <h2 id="the-programmes" className="sr-only">
            The two programmes
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            {PROGRAMS.map((program, index) => (
              <Reveal key={program.id} delay={index * 0.08}>
                <ProgramCard
                  program={program}
                  href={`/start?program=${program.id}`}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Self-Paced in detail ─────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <Reveal preset="imageReveal">
              <ParallaxImage
                image={IMAGES.studentDashboard}
                strength={8}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch aspect-[5/4] w-full border border-border"
              />
            </Reveal>
            <div>
              <SectionHeading
                animate
                eyebrow="Self-Paced · ₹1,500"
                title="A content-based internship you run on your own schedule."
                description="Everything opens on day one. You read the module material, work the practical activity, and take assessments whenever you are ready."
              />
              <Reveal delay={0.08} className="mt-7">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  What Self-Paced does not include
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(selfPaced?.excludes ?? []).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[0.85rem] text-muted-foreground"
                    >
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-[0.82rem] leading-relaxed text-muted-foreground">
                  Those six are exactly what the Industry-Led programme adds. Nothing
                  else changes between the two tracks.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal className="mt-16">
            <LearningFlow />
          </Reveal>
        </div>
      </section>

      {/* ── Industry-Led in detail ───────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <SectionHeading
                animate
                eyebrow="Industry-Led · ₹5,000"
                title="The 15-day structure."
                description="Live sessions run each evening across fifteen days, following a fixed arc from foundation to completion, with mentor interaction and a guided project along the way."
              />
              <Reveal delay={0.08} className="mt-7">
                <ul className="space-y-2.5 text-sm">
                  {[
                    "Everything in Self-Paced, on the same completion standard",
                    "Video lessons and live sessions with working professionals",
                    "Mentor interaction, live Q&A and guided assignments",
                    "Certificate generated only after the completion of live classes (15-day duration period)",
                    "Career guidance and one month of PehlaChance access",
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
              </Reveal>
            </div>
            <Reveal preset="imageReveal" delay={0.05}>
              <StaticImage
                image={IMAGES.industryLedMentor}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch-r aspect-[5/4] w-full border border-border"
              />
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <FifteenDayTimeline />
          </Reveal>

        </div>
      </section>

      {/* ── Full comparison ──────────────────────────────────────────── */}
      <section id="compare" className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Side by Side"
            title="Feature comparison"
            description="Every row below is the same product rule the dashboard and the checkout follow."
          />
          <Reveal delay={0.08} className="mt-10">
            <ComparisonTable />
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            animate
            eyebrow="FAQ"
            title="Programme questions"
            description="The answers below apply to both programmes unless stated otherwise."
          />
          <Reveal delay={0.08}>
            <FaqAccordion items={programFaqs} />
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.futureCareer}
        title={["Ready to choose?", "Start with your domain."]}
        description="Begin with your profile and domain — you can pick the programme at the end of onboarding."
        primary={{ label: "Start My Internship", href: "/start" }}
        secondary={{ label: "Browse domains", href: "/domains" }}
        note="Certificates unlock only after the completion requirements are met."
      />
    </SiteShell>
  );
}
