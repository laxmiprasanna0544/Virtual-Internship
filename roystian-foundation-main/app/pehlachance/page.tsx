import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Compass, GraduationCap, UserRound } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { StaticImage } from "@/components/motion/parallax-image";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "PehlaChance",
  description:
    "PehlaChance is the career companion included free for one month with the Industry-Led virtual internship.",
};

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Internship opportunities",
    body: "A place to keep discovering structured internship experiences after your programme ends.",
  },
  {
    icon: Briefcase,
    title: "Jobs",
    body: "Role listings organised by domain and experience level so browsing stays relevant.",
  },
  {
    icon: UserRound,
    title: "Professional profile",
    body: "One profile carrying your completed tracks, practical work and verified credentials.",
  },
  {
    icon: Compass,
    title: "Career opportunities",
    body: "Guidance material and next-step suggestions based on the domain you completed.",
  },
];

export default function PehlaChancePage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.careerOpportunities}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "PehlaChance" }]}
        eyebrow="Included with Industry-Led · 1 month free"
        title={["Your internship ends.", "Your career journey doesn't."]}
        description="Completing an internship should not be the end of the process. PehlaChance is where the work you have done stays visible and keeps pointing somewhere."
        actions={
          <>
            <Button asChild size="xl">
              <Link href="/start?program=industry-led">Start Industry-Led</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/programs">Compare programmes</Link>
            </Button>
          </>
        }
      />

      <section className="section border-b border-border">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <SectionHeading
                animate
                eyebrow="What It Carries"
                title="One profile, four things worth following."
                description="PehlaChance keeps your completed tracks, practical work and verified credentials in one place after the programme."
              />
            </div>
            <Reveal preset="imageReveal">
              <StaticImage
                image={IMAGES.futureCareer}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="mask-arch-r aspect-[5/4] w-full border border-border"
              />
            </Reveal>
          </div>

          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Reveal key={feature.title} child>
                <div className="lift-card group h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                    <feature.icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-foreground">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                About this page
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                This is a preview of the PehlaChance experience within the demonstration
                environment. No live job listings, employer relationships or placement
                outcomes are represented here, and none are promised. Industry-Led
                students have one month of access activated automatically once their
                internship is completed.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.careerOpportunities}
        title={["Included with", "the Industry-Led programme."]}
        description="Choose the ₹5,000 Industry-Led virtual internship and one month of PehlaChance is activated at no additional cost on completion."
        primary={{ label: "Start Industry-Led", href: "/start?program=industry-led" }}
        secondary={{ label: "Compare programmes", href: "/programs" }}
        note="PehlaChance is an opportunity platform. No placement, interview or hiring outcome is promised."
      />
    </SiteShell>
  );
}
