import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { DomainExplorer } from "@/components/site/domain-explorer";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS, domainsByCluster } from "@/data/domains";
import { CLUSTER_BLURB } from "@/data/career-pathways";
import { PROGRAMS } from "@/data/programs";
import { IMAGES } from "@/lib/images";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Internships",
  description:
    "Two ways to start — Career Starter and Industry Sprint — across 12 career domains in three clusters.",
};

export default function InternshipsPage() {
  const clusters = domainsByCluster();

  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.heroStudentLearning}
        eyebrow="Internships"
        title={["Two ways to start.", "Twelve fields to start in."]}
        description="Choose the level of guidance you want, then choose the field you want to work in. Both programmes end in the same verifiable certificate."
        breadcrumbs={[{ label: "Internships" }]}
        meta={[
          { label: "Career domains", value: "12" },
          { label: "Programme length", value: "15 days" },
          { label: "Assessment pass mark", value: "70%" },
        ]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/start">
                Start your internship <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/programs">Compare in detail</Link>
            </Button>
          </>
        }
      />

      {/* ── The two programmes ───────────────────────────────────────── */}
      <section id="programs" className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Two Ways to Start"
            title="Pick the level of engagement that fits you."
            description="The curriculum is the same. What changes is how much guidance, mentorship and career preparation comes with it."
          />

          <Stagger className="mt-12 grid gap-6 lg:grid-cols-2">
            {PROGRAMS.map((program, index) => {
              const featured = program.id === "industry-led";
              return (
                <Reveal key={program.id} child>
                  <div
                    id={program.id}
                    className={
                      featured
                        ? "surface-ink lift-card flex h-full flex-col rounded-2xl p-8 shadow-lift"
                        : "lift-card flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-soft"
                    }
                  >
                    <Badge
                      variant={featured ? "secondary" : "outline"}
                      className="w-fit font-mono"
                    >
                      {formatINR(program.price)}
                    </Badge>

                    <h3
                      className={`mt-5 font-display text-3xl font-semibold tracking-tight ${featured ? "text-white" : "text-foreground"}`}
                    >
                      {program.marketingName}
                    </h3>
                    <p
                      className={`mt-1 text-sm font-semibold ${featured ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      {index === 0 ? "Self-Paced Program" : "Industry-Led Program"}
                    </p>
                    <p
                      className={`mt-4 text-[0.92rem] leading-relaxed ${featured ? "text-white/75" : "text-muted-foreground"}`}
                    >
                      {program.promise}
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {program.features.slice(0, 6).map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-white/70" : "text-primary"}`}
                            aria-hidden="true"
                          />
                          <span
                            className={`text-[0.87rem] leading-relaxed ${featured ? "text-white/80" : "text-muted-foreground"}`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      size="lg"
                      className={`group mt-8 ${featured ? "bg-white text-ink-surface hover:bg-white/90" : ""}`}
                    >
                      <Link href={`/start?program=${program.id}`}>
                        {featured ? "Join Industry Sprint" : "Start Your Internship"}
                        <ArrowRight className="cta-arrow" />
                      </Link>
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ── The three clusters ───────────────────────────────────────── */}
      <section id="domains" className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Choose Your Career Track"
            title="Twelve domains, three clusters."
            description="Every domain has its own overview, learning pathway, skills, projects, assessments, career applications and programme options."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {clusters.map((group) => (
              <Reveal key={group.cluster}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {group.cluster}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {CLUSTER_BLURB[group.cluster]}
                  </p>
                  <ul className="mt-5 flex-1 space-y-1.5 border-t border-border pt-4">
                    {group.domains.map((domain) => (
                      <li key={domain.id}>
                        <Link
                          href={`/internships/${domain.id}`}
                          className="group flex items-center gap-2.5 rounded-lg py-1.5 text-[0.88rem] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <DynamicIcon
                            name={domain.icon}
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                          />
                          {domain.name}
                          <ArrowRight
                            className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.08} className="mt-14">
            <DomainExplorer domains={DOMAINS} />
          </Reveal>
        </div>
      </section>

      {/* ── What every domain page answers ───────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Every domain answers five questions"
            title="So a domain page is never just a course description."
          />

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "What will I learn?",
              "What will I practise?",
              "What will I build?",
              "How will I be assessed?",
              "What career pathways can these skills support?",
            ].map((question, index) => (
              <Reveal key={question} child>
                <div className="relative h-full rounded-2xl border border-border bg-card p-6 pt-8 shadow-soft">
                  <span className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-[0.95rem] font-semibold text-foreground">
                    {question}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand
        image={IMAGES.careerOpportunities}
        title={["Pick a field.", "Start building evidence."]}
        description="Registration takes a few minutes. You choose your domain, your level and your programme."
        primary={{ label: "Start your internship", href: "/start" }}
        secondary={{ label: "See all 12 domains", href: "/domains" }}
        note="No guaranteed placement is promised. Certificates are issued only after the completion requirements are met."
      />
    </SiteShell>
  );
}
