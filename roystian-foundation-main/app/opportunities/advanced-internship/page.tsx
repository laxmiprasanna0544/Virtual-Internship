import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, MapPin, Scale } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { FELLOWSHIP_AREAS } from "@/data/opportunities";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Advanced Internship Pathway",
  description:
    "A 3-month paid offline internship through the Roystian technology ecosystem in Hyderabad, for selected students.",
};

const ECOSYSTEM = [
  {
    title: "Roystian Foundation",
    body: "Student development programme — learn, build and prove skills.",
  },
  {
    title: "Assessment + Selection",
    body: "Evaluate skills and fit against the areas with openings.",
  },
  {
    title: "Roystian Advanced Technologies",
    body: "Technology and startup exposure in a working environment.",
  },
  {
    title: "3-Month Internship",
    body: "Paid, real-world experience with mentorship and a completion certificate.",
  },
];

export default function AdvancedInternshipPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.careerOpportunities}
        eyebrow="Advanced Internship Pathway"
        title={["Perform. Get selected.", "Get industry experience."]}
        description="High-performing students may be shortlisted for a 3-month paid offline internship through the Roystian technology ecosystem in Hyderabad."
        breadcrumbs={[
          { label: "Opportunities", href: "/opportunities" },
          { label: "Advanced Internships" },
        ]}
        meta={[
          { label: "Duration", value: "3 months" },
          { label: "Location", value: "Hyderabad" },
          { label: "Type", value: "Paid, offline" },
        ]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/fellowship">
                Check your eligibility <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/opportunities/fellowship">About the fellowship</Link>
            </Button>
          </>
        }
      />

      {/* ── The ecosystem path ───────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Roystian Technology Ecosystem"
            title="From learning to real-world experience."
            description="Four stages, each one entered on the strength of what you did in the last."
          />

          <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM.map((stage, index) => (
              <Reveal key={stage.title} child>
                <div className="lift-card relative h-full rounded-2xl border border-border bg-card p-6 pt-8 shadow-soft">
                  <span className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-[0.95rem] font-semibold text-foreground">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stage.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>

          {/*
            The PRD is explicit: no T-Hub certification or approval may be
            claimed. The wording below is the approved formulation and should
            not be strengthened without written authorisation.
          */}
          <Reveal delay={0.12}>
            <div className="mt-12 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-foreground">
                Roystian Advanced Technologies operates from the Hyderabad
                startup ecosystem. Selected students may have an opportunity to
                undertake a paid offline internship through the Roystian
                technology ecosystem in Hyderabad, subject to applicable
                workspace and access arrangements. This is not a
                third-party-certified or third-party-approved internship.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Areas ────────────────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Potential areas"
            title="Where selected students may work."
          />

          <Stagger className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {FELLOWSHIP_AREAS.map((area) => (
              <Reveal key={area} child>
                <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.85rem] font-medium text-foreground shadow-soft">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {area}
                </span>
              </Reveal>
            ))}
          </Stagger>

          <Reveal delay={0.12}>
            <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-xl border border-border bg-card p-5">
              <Scale
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Selection is based on applicable assessments, project
                performance, interview, availability and eligibility. Completing
                a programme does not guarantee shortlisting or selection.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.futureCareer}
        title={["The opportunity", "is earned."]}
        primary={{ label: "Check your eligibility", href: "/dashboard/fellowship" }}
        secondary={{ label: "Start your internship", href: "/start" }}
      />
    </SiteShell>
  );
}
