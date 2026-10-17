import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { StaticImage } from "@/components/motion/parallax-image";
import { SectionHeading } from "@/components/site/section";
import { SplitHeading } from "@/components/motion/split-heading";
import { DynamicIcon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { ABOUT_PILLARS, SITE } from "@/data/content";
import { TEAM } from "@/data/team";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description:
    "Roystian Foundation is a Section 8 non-profit organization working across technology, research, career development and community impact.",
};

const SECTION_IDS: Record<string, string> = {
  "Artificial Intelligence": "artificial-intelligence",
  "Deep Technology": "deep-technology",
  Sustainability: "sustainability",
  "Career Development": "career-development",
  "Research & Innovation": "research-innovation",
  "Community Impact": "community-impact",
};

export default function AboutPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.foundationCampus}
        size="tall"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow={`About ${SITE.name}`}
        title={["Technology, research and", "career solutions for", "real-world problems."]}
        description="A Section 8 non-profit organization dedicated to developing technologies, research initiatives, career solutions and social innovations that address real-world challenges."
        actions={
          <>
            <Button asChild size="xl">
              <Link href="/start">Start an internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/colleges">Partner with us</Link>
            </Button>
          </>
        }
      />

      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <SplitHeading
            lines={["Our", "mission"]}
            className="display-sm text-foreground"
            accentLine={1}
          />
          <Reveal delay={0.08}>
            <p className="lede">
              Roystian Foundation exists to close the distance between what students
              learn and what work actually requires. A degree supplies knowledge;
              practical experience turns that knowledge into a career.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We build programmes that are structured, assessable and honest: defined
              learning outcomes, real practical activities, and credentials that record
              completed work rather than attendance. Our work spans technology
              development, applied research, education delivery and community
              programmes, and the virtual internship platform is one part of that.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We do not promise jobs or placements. We build the skills, the evidence
              of those skills, and the confidence to use them.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/25">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Areas of Work"
            title="Six areas shape what the Foundation builds, researches and teaches."
          />

          <Stagger className="mt-12 space-y-5">
            {ABOUT_PILLARS.map((pillar) => (
              <Reveal key={pillar.title} child>
                <div
                  id={SECTION_IDS[pillar.title]}
                  className="lift-card scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <DynamicIcon name={pillar.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {pillar.body}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Sustainability is one of the six areas — show it rather than assert it. */}
      <section className="section overflow-hidden border-b border-border">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal preset="imageReveal">
            <StaticImage
              image={IMAGES.sustainability}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="mask-arch aspect-[5/4] w-full border border-border"
            />
          </Reveal>
          <SectionHeading
            animate
            eyebrow="In Practice"
            title="Research that feeds back into what we teach."
            description="Applied work across intelligent systems, connected devices and environmental measurement shapes the curriculum students then work through — the two are not run as separate programmes."
          />
        </div>
      </section>

      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Our Team"
            title="The people behind the Foundation."
            description="A small team working across strategy, operations, partnerships and technology."
          />

          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <Reveal key={member.name} child>
                <article className="lift-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  <StaticImage
                    image={member.image}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="aspect-square w-full border-b border-border"
                  />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/25">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <SplitHeading
            lines={["Where we", "are based"]}
            className="display-sm text-foreground"
            accentLine={1}
          />
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {SITE.name}
                  </h3>
                  <address className="mt-2 text-sm not-italic leading-relaxed text-muted-foreground">
                    {SITE.address.line1}
                    <br />
                    {SITE.address.line2}
                    <br />
                    {SITE.address.city}, {SITE.address.state}{" "}
                    {SITE.address.postalCode}
                    <br />
                    {SITE.address.country}
                  </address>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {SITE.email}
                </a>
                {SITE.phones.map((phone) => (
                  <a
                    key={phone.tel}
                    href={`tel:${phone.tel}`}
                    className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {phone.display}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                What we do not claim
              </h2>
              <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
                {[
                  "No guaranteed jobs or placements",
                  "No government or university accreditation is claimed",
                  "No affiliation with companies is implied by any content on this site",
                  "Certificates are earned through completed work, never sold",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden="true">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        image={IMAGES.studentCommunity}
        title={["Work with us."]}
        description="Students, colleges and organisations can all engage with the Foundation's programmes."
        primary={{ label: "Start an internship", href: "/start" }}
        secondary={{ label: "Partner with us", href: "/colleges" }}
      />
    </SiteShell>
  );
}
