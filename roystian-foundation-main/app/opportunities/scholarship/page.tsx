import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Info } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { SCHOLARSHIP_TIERS } from "@/data/opportunities";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Roystian Skill Scholarship",
  description:
    "Support at 100%, 75% or 50% so talent is not limited by a student's ability to pay.",
};

const CRITERIA = [
  {
    title: "Financial need",
    body: "Declared household income band, reviewed against the tier requested.",
  },
  {
    title: "Demonstrated intent",
    body: "A short statement on why the programme matters to you and what you will do with it.",
  },
  {
    title: "Academic or practical evidence",
    body: "Any existing work, results or projects that show you will use the place.",
  },
  {
    title: "Availability",
    body: "Confirmation that you can commit to the programme you are applying for.",
  },
];

export default function ScholarshipPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.studentCommunity}
        eyebrow="Roystian Skill Scholarship"
        title={["Skills should", "create opportunity."]}
        description="Talent should not be limited by a student's ability to pay. Support is offered at three levels against transparent eligibility criteria."
        breadcrumbs={[
          { label: "Opportunities", href: "/opportunities" },
          { label: "Skill Scholarship" },
        ]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/scholarship">
                Apply for support <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/programs">See programme pricing</Link>
            </Button>
          </>
        }
      />

      {/* ── Tiers ────────────────────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Support levels"
            title="Three tiers, one application."
            description="You apply for the tier you need. The review considers financial need alongside your stated intent and any evidence you already have."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {SCHOLARSHIP_TIERS.map((tier, index) => (
              <Reveal key={tier.tier} child>
                <div
                  className={
                    index === 0
                      ? "surface-ink lift-card h-full rounded-2xl p-7 shadow-lift"
                      : "lift-card h-full rounded-2xl border border-border bg-card p-7 shadow-soft"
                  }
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${index === 0 ? "bg-white/10 text-white" : "bg-primary/10 text-primary"}`}
                  >
                    <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3
                    className={`mt-5 font-display text-2xl font-semibold tracking-tight ${index === 0 ? "text-white" : "text-foreground"}`}
                  >
                    {tier.label}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${index === 0 ? "text-white/75" : "text-muted-foreground"}`}
                  >
                    {tier.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Criteria ─────────────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Eligibility"
            title="What the review considers."
            description="Criteria are published up front so nobody applies without knowing what is being assessed."
          />

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
            {CRITERIA.map((item) => (
              <Reveal key={item.title} child>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="text-[0.95rem] font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>

          <Reveal delay={0.12}>
            <div className="mt-12 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                The scholarship programme is operated by Roystian Foundation, a
                Section 8 non-profit. Applying does not guarantee an award, and
                the number of places available in each cycle is limited.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.studentJourney}
        title={["Talent should not be limited", "by ability to pay."]}
        primary={{ label: "Apply for support", href: "/dashboard/scholarship" }}
        secondary={{ label: "See all opportunities", href: "/opportunities" }}
      />
    </SiteShell>
  );
}
