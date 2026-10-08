import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, FolderCheck, Scale, Users } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { FELLOWSHIP_AREAS } from "@/data/opportunities";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Roystian Talent Fellowship",
  description:
    "An advanced pathway for high-performing students — a 3-month paid internship, mentorship and a professional portfolio.",
};

const PACKAGE = [
  {
    icon: Briefcase,
    title: "3-Month Paid Internship",
    body: "Real project exposure in a technology environment.",
  },
  {
    icon: Users,
    title: "Mentorship",
    body: "Guidance from experienced professionals throughout.",
  },
  {
    icon: FolderCheck,
    title: "Professional Portfolio",
    body: "Technology experience plus an internship completion certificate.",
  },
];

const GATES = [
  {
    step: "01",
    label: "Complete your internship",
    detail: "Finish the programme and unlock your completion certificate.",
  },
  {
    step: "02",
    label: "Pass your assessments",
    detail: "Every module assessment passed at 70% or above, plus the final.",
  },
  {
    step: "03",
    label: "Submit projects",
    detail: "At least one structured project taken through to submission.",
  },
  {
    step: "04",
    label: "Enter an industry challenge",
    detail: "Demonstrate you can handle an open-ended problem.",
  },
];

export default function FellowshipPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.certificateAchievement}
        eyebrow="Roystian Talent Fellowship"
        title={["An advanced pathway", "for high-performing students."]}
        description="Selected candidates may receive a comprehensive package designed to accelerate their professional development. Your performance can open the door to the next stage."
        breadcrumbs={[
          { label: "Opportunities", href: "/opportunities" },
          { label: "Talent Fellowship" },
        ]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/fellowship">
                Check your eligibility <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/opportunities/advanced-internship">
                How selection works
              </Link>
            </Button>
          </>
        }
      />

      {/* ── The package ──────────────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="What selected candidates may receive"
            title="A package built to accelerate a career, not decorate it."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {PACKAGE.map((item) => (
              <Reveal key={item.title} child>
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[0.98rem] font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── How it is earned ─────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="The opportunity is earned"
            title="Four gates open the application."
            description="These are the platform's requirements before you can apply. Meeting them makes you eligible — it does not make you selected."
          />

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
            {GATES.map((gate) => (
              <Reveal key={gate.step} child>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {gate.step}
                  </span>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-foreground">
                      {gate.label}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {gate.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Areas ────────────────────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Potential areas"
            title="Where fellows may be placed."
          />

          <Stagger className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {FELLOWSHIP_AREAS.map((area) => (
              <Reveal key={area} child>
                <span className="rounded-full border border-border bg-card px-4 py-2 text-[0.85rem] font-medium text-foreground shadow-soft">
                  {area}
                </span>
              </Reveal>
            ))}
          </Stagger>

          <Reveal delay={0.12}>
            <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-xl border border-border bg-muted/40 p-5">
              <Scale
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Selection is based on applicable assessments, project
                performance, interview, availability and eligibility. Being
                eligible to apply does not guarantee shortlisting or selection,
                and no placement is promised at any stage.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.futureCareer}
        title={["Your performance can open", "the door to the next stage."]}
        primary={{ label: "Check your eligibility", href: "/dashboard/fellowship" }}
        secondary={{ label: "See all opportunities", href: "/opportunities" }}
      />
    </SiteShell>
  );
}
