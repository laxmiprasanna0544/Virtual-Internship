import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { DomainCard } from "@/components/site/domain-card";
import { DynamicIcon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { IMAGES } from "@/lib/images";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "College Internships Are Open",
  description:
    "Choose your domain, choose your experience level, start your virtual internship. Self-Paced ₹1,500 or Industry-Led ₹5,000.",
};

export default function CollegeInternshipsPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.studentCommunity}
        size="tall"
        eyebrow="Internships Are Open"
        title={["Choose your domain.", "Choose your experience.", "Start your internship."]}
        description="Twelve domains, structured modules, real practical activities, and a certificate anyone can verify online."
        actions={
          <>
            <Button asChild size="xl" className="px-8">
              <Link href="/start">Start My Internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="#domains">Browse the domains</Link>
            </Button>
          </>
        }
        meta={PROGRAMS.map((program) => ({
          label: program.id === "industry-led" ? "Industry-Led" : "Self-Paced",
          value: formatINR(program.price),
        })).concat([{ label: "Takes about two minutes", value: "Sign up" }])}
      />

      {/* Quick trust strip */}
      <section className="border-b border-border bg-muted/30 py-10">
        <div className="container grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "15 days",
              body: "Self-paced or a structured live schedule.",
            },
            {
              icon: CheckCircle2,
              title: "Assessed",
              body: "Module assessments and a final assessment at 70%.",
            },
            {
              icon: ShieldCheck,
              title: "Verifiable",
              body: "Every certificate carries a public verification page.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Domain picker */}
      <section id="domains" className="section scroll-mt-20 border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Pick Your Domain"
            title="Twelve tracks, one completion standard."
            description="Tap a domain to start onboarding with it already selected."
          />

          <Stagger stagger={0.04} className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => (
              <Reveal key={domain.id} child>
                <Link
                  href={`/start?domain=${domain.id}`}
                  className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <DynamicIcon name={domain.icon} className="h-[1.1rem] w-[1.1rem]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {domain.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {domain.modules.length} modules · {domain.levels.length} levels
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="A Place To Start"
            title="Three tracks students most often ask about."
            description="Every domain runs the same structure, so this is a starting point rather than a ranking."
          />
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.slice(0, 3).map((domain) => (
              <Reveal key={domain.id} child>
                <DomainCard domain={domain} />
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand
        image={IMAGES.futureCareer}
        title={["Ready when", "you are."]}
        description="Start with your profile, pick a domain and experience level, then choose the programme that fits."
        primary={{ label: "Start My Internship", href: "/start" }}
        secondary={{ label: "Compare programmes", href: "/programs" }}
        note="Takes about two minutes. No guaranteed placement is promised."
      />
    </SiteShell>
  );
}
