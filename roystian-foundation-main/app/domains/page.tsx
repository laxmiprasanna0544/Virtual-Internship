import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { DomainCard } from "@/components/site/domain-card";
import { DomainExplorer } from "@/components/site/domain-explorer";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Domains",
  description:
    "Twelve virtual internship domains across technology, data, business, engineering and impact. Each track includes modules, assessments and a practical activity.",
};

const CATEGORIES = ["Technology", "Data", "Business", "Engineering", "Impact"] as const;

export default function DomainsPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.domainAiMl}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Domains" }]}
        eyebrow="Choose Your Path"
        title={["Twelve domains.", "One structure."]}
        description="Every domain follows the same rhythm — concepts, practice, assessment, a practical activity, then a verifiable certificate. Only the subject changes."
        actions={
          <>
            <Button asChild size="xl">
              <Link href="/start">Start My Internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/programs">Compare programmes</Link>
            </Button>
          </>
        }
        meta={[
          { label: "Domains", value: "12" },
          { label: "Modules per track", value: "10" },
          { label: "Experience levels", value: "3" },
        ]}
      />

      {/* Explore one track at a time before scanning the full grid. */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Explore"
            title="Look inside a track."
            description="Pick a domain to see what it covers and what you will build."
          />
          <Reveal className="mt-12">
            <DomainExplorer domains={DOMAINS} />
          </Reveal>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/30">
        <div className="container space-y-16">
          {CATEGORIES.map((category) => {
            const domains = DOMAINS.filter((d) => d.category === category);
            if (domains.length === 0) return null;
            return (
              <div key={category}>
                <div className="mb-6 flex items-baseline gap-3">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {category}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {domains.length} {domains.length === 1 ? "domain" : "domains"}
                  </span>
                </div>
                <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {domains.map((domain) => (
                    <Reveal key={domain.id} child>
                      <DomainCard domain={domain} />
                    </Reveal>
                  ))}
                </Stagger>
              </div>
            );
          })}
        </div>
      </section>

      <CtaBand
        image={IMAGES.studentCommunity}
        title={["Found your field?", "Start the internship."]}
        description="Onboarding takes a couple of minutes, and you can change your domain, level and programme before checkout."
        primary={{ label: "Start My Internship", href: "/start" }}
        secondary={{ label: "How it works", href: "/how-it-works" }}
      />
    </SiteShell>
  );
}
