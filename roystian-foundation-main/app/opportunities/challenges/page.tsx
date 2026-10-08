import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHALLENGES } from "@/data/challenges";
import { getDomain } from "@/data/domains";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Roystian Industry Challenge",
  description:
    "Six recurring challenges where students demonstrate they can apply knowledge rather than simply consume content.",
};

export default function ChallengesPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.practicalProject}
        eyebrow="Roystian Industry Challenge"
        title={["Can you solve", "a real problem?"]}
        description="Open-ended problems outside the structured curriculum. Challenge results feed your Career Readiness Score and are considered for the advanced internship pathway."
        breadcrumbs={[
          { label: "Opportunities", href: "/opportunities" },
          { label: "Challenges" },
        ]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/challenges">
                Enter from your dashboard <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/start">Start your internship</Link>
            </Button>
          </>
        }
      />

      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Six challenges"
            title="Pick the problem that fits your field."
            description="Each challenge states its brief, its requirements and exactly what it will be judged on before you start."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {CHALLENGES.map((challenge) => (
              <Reveal key={challenge.id} child>
                <div className="lift-card flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <DynamicIcon name={challenge.icon} className="h-5 w-5" />
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge variant="outline" className="capitalize">
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="secondary">{challenge.durationLabel}</Badge>
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
                    {challenge.title}
                  </h3>
                  <p className="mt-1.5 text-[0.9rem] font-medium text-primary">
                    {challenge.summary}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {challenge.brief}
                  </p>

                  <div className="mt-6 border-t border-border pt-4">
                    <p className="eyebrow mb-2.5">Judged on</p>
                    <ul className="space-y-1.5">
                      {challenge.evaluationCriteria.map((criterion) => (
                        <li
                          key={criterion}
                          className="flex items-start gap-2 text-[0.8rem] leading-relaxed text-muted-foreground"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {challenge.domainIds.length > 0 && (
                    <p className="mt-5 text-[0.76rem] leading-relaxed text-muted-foreground">
                      <span className="font-semibold">Most relevant to:</span>{" "}
                      {challenge.domainIds
                        .map((id) => getDomain(id)?.shortName ?? id)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand
        image={IMAGES.careerOpportunities}
        title={["Prove you can apply it,", "not just recall it."]}
        description="Challenge entries are evaluated and scored. A score of 70% or above earns the Industry Challenge badge."
        primary={{ label: "Enter a challenge", href: "/dashboard/challenges" }}
        secondary={{ label: "See all opportunities", href: "/opportunities" }}
      />
    </SiteShell>
  );
}
