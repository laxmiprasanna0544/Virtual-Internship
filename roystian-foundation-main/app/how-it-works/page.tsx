import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { SectionHeading } from "@/components/site/section";
import { JourneyTimeline } from "@/components/site/journey-timeline";
import { LearningFlow } from "@/components/site/learning-flow";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/data/content";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Choose a domain, learn and practise, complete the requirements, and earn a verifiable internship certificate.",
};

const REQUIREMENTS = [
  {
    label: "Profile completed",
    detail: "Your details are recorded against the registration.",
  },
  {
    label: "Learning modules completed",
    detail: "All ten modules of your domain track marked complete.",
  },
  {
    label: "Module assessments passed",
    detail: "Each module assessment passed at 70% or above. Up to five attempts a day.",
  },
  {
    label: "Practical task submitted and reviewed",
    detail: "Your domain's practical activity submitted for review.",
  },
  {
    label: "Final assessment passed",
    detail: "The final assessment passed at 70% or above.",
  },
];

export default function HowItWorksPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.studentJourney}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "How It Works" }]}
        eyebrow="How It Works"
        title={["Discover. Learn.", "Practise. Get certified."]}
        description="The platform is built around one idea: a certificate should record work that was actually done. Here is exactly what that looks like from the first click to the verification page."
        actions={
          <>
            <Button asChild size="xl">
              <Link href="/start">Start My Internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/verify">Verify a certificate</Link>
            </Button>
          </>
        }
      />

      <section className="section border-b border-border">
        <div className="container">
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <Reveal key={item.step} child>
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.step}
                  </span>
                  <h2 className="mt-3 text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>

          <Reveal className="mt-16">
            <LearningFlow />
          </Reveal>
        </div>
      </section>

      <section className="section overflow-hidden border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="The Arc"
            title="Where the internship sits in your journey"
            description="Six stages, from the degree you are already studying for to the work you can point at afterwards."
          />
        </div>
        <Reveal preset="fadeIn" className="mt-12">
          <ParallaxImage
            image={IMAGES.studentCommunity}
            alt=""
            strength={12}
            sizes="100vw"
            className="h-[34vh] min-h-[14rem] w-full sm:h-[40vh]"
          />
        </Reveal>
        <div className="container">
          <Reveal className="mt-14">
            <JourneyTimeline />
          </Reveal>
        </div>
      </section>

      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              title="Completion requirements"
              description="The certificate is locked until every requirement below is satisfied. Paying for a programme starts the internship — it does not complete it."
            />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <Lock className="h-4 w-4 text-warning-ink" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  Incomplete → certificate locked
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <Unlock className="h-4 w-4 text-success" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  Complete → certificate earned
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ol className="space-y-3">
              {REQUIREMENTS.map((item, index) => (
                <li
                  key={item.label}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 font-mono text-[0.7rem] font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.certificateAchievement}
        title={["Start when", "you are ready."]}
        description="Onboarding takes a couple of minutes. You can change your domain, experience level and programme before checkout."
        primary={{ label: "Start My Internship", href: "/start" }}
        secondary={{ label: "Compare programmes", href: "/programs" }}
      />
    </SiteShell>
  );
}
