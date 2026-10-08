import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, GraduationCap, HeartHandshake, Trophy } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Industry challenges, the Roystian Talent Fellowship, the advanced internship pathway, and the Skill Scholarship.",
};

const PATHS = [
  {
    href: "/opportunities/challenges",
    icon: Trophy,
    title: "Industry Challenges",
    body: "Six recurring challenges where you demonstrate that you can apply knowledge rather than consume content.",
    meta: "Open to all students",
  },
  {
    href: "/opportunities/fellowship",
    icon: Award,
    title: "Roystian Talent Fellowship",
    body: "An advanced pathway for high-performing students — a paid internship, mentorship and a professional portfolio.",
    meta: "Earned through performance",
  },
  {
    href: "/opportunities/advanced-internship",
    icon: GraduationCap,
    title: "Advanced Internship Pathway",
    body: "A 3-month paid offline internship through the Roystian technology ecosystem in Hyderabad.",
    meta: "Selection-based",
  },
  {
    href: "/opportunities/scholarship",
    icon: HeartHandshake,
    title: "Roystian Skill Scholarship",
    body: "Support at 100%, 75% or 50% so talent is not limited by a student's ability to pay.",
    meta: "Needs-based",
  },
];

export default function OpportunitiesPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.careerOpportunities}
        eyebrow="Opportunities"
        title={["The opportunity", "is earned."]}
        description="What comes after the certificate. Each pathway below is opened by demonstrated performance, not by payment — and none of them is a guarantee."
        breadcrumbs={[{ label: "Opportunities" }]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/opportunities/challenges">
                Enter a challenge <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/opportunities/fellowship">See the fellowship</Link>
            </Button>
          </>
        }
      />

      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Four pathways"
            title="Perform. Get selected. Get industry experience."
            description="Complete your internship, pass your assessments, submit projects and enter a challenge — that is what opens the door."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {PATHS.map((path) => (
              <Reveal key={path.href} child>
                <Link
                  href={path.href}
                  className="lift-card group flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <path.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
                    {path.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {path.body}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="eyebrow">{path.meta}</span>
                    <ArrowRight
                      className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </Stagger>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
              Selection for any advanced pathway is based on applicable
              assessments, project performance, interview, availability and
              eligibility. Completing a programme does not guarantee selection,
              and no placement is promised.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.futureCareer}
        title={["Your performance", "opens the next door."]}
        primary={{ label: "Start your internship", href: "/start" }}
        secondary={{ label: "Check your readiness", href: "/dashboard/readiness" }}
      />
    </SiteShell>
  );
}
