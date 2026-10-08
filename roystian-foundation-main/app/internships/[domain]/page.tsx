import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  FlaskConical,
  Hammer,
  Target,
  Users,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { ProgramCard } from "@/components/site/program-card";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS, getDomain } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { EXPERIENCE_LEVELS } from "@/data/content";
import { getTrainerForDomain } from "@/data/trainers";
import { IMAGES, domainImage } from "@/lib/images";

interface PageProps {
  params: Promise<{ domain: string }>;
}

/** Every domain is known at build time, so unknown slugs are a true 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOMAINS.map((domain) => ({ domain: domain.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: domainId } = await params;
  const domain = getDomain(domainId);
  if (!domain) return { title: "Internship not found" };
  return {
    title: `${domain.name} Virtual Internship`,
    description: domain.description,
    openGraph: {
      title: `${domain.name} Virtual Internship | Roystian Foundation`,
      description: domain.description,
    },
  };
}

export default async function DomainDetailPage({ params }: PageProps) {
  const { domain: domainId } = await params;
  const domain = getDomain(domainId);
  if (!domain) notFound();

  const trainer = getTrainerForDomain(domain.id);
  const levels = EXPERIENCE_LEVELS.filter((level) =>
    domain.levels.includes(level.value),
  );

  return (
    <SiteShell bleed>
      <PageHero
        image={domainImage(domain.id)}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Domains", href: "/domains" },
          { label: domain.shortName },
        ]}
        eyebrow={`${domain.cluster} · ${domain.code}`}
        title={[domain.name, "Virtual Internship"]}
        description={domain.tagline}
        actions={
          <>
            <Button asChild size="xl">
              <Link href={`/start?domain=${domain.id}`}>Start this internship</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/programs">Compare programmes</Link>
            </Button>
          </>
        }
        meta={[
          { label: "Modules", value: String(domain.modules.length) },
          { label: "Duration", value: "15 days" },
          { label: "Pass threshold", value: "70%" },
        ]}
      />

      {/* Overview + at a glance */}
      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DynamicIcon name={domain.icon} className="h-5 w-5" />
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{domain.category}</Badge>
                <Badge variant="outline">{domain.modules.length} modules</Badge>
                {domain.curriculumSource === "demo" && (
                  <Badge variant="warning">Demo curriculum</Badge>
                )}
              </div>
            </div>
            <p className="lede mt-6 max-w-2xl">{domain.longDescription}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                At a glance
              </h2>
              <dl className="mt-4 space-y-3.5 text-sm">
                {[
                  { label: "Modules", value: `${domain.modules.length} modules` },
                  {
                    label: "Module assessments",
                    value: `${domain.modules.length} + final assessment`,
                  },
                  { label: "Duration", value: "15 days" },
                  { label: "Pass threshold", value: "70%" },
                  {
                    label: "Experience levels",
                    value: levels.map((l) => l.label.split(" / ")[0]).join(", "),
                  },
                  {
                    label: "Certificate",
                    value: "Issued on completion, verifiable online",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-border pb-3.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Who this is for / What you will learn */}
      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Who this is for
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {domain.whoFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                What you will learn
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {domain.whatYouLearn.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* What you will practise / Career pathways — questions 2 and 5 of the
          five every domain page must answer. Learn (1), build (3) and assess
          (4) are covered by the sections above and below. */}
      <section className="section border-b border-border bg-muted/25">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <Hammer className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                What you will practise
              </h2>
            </div>
            <ul className="mt-5 space-y-3">
              {domain.whatYouPractise.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Career pathways these skills support
              </h2>
            </div>
            <ul className="mt-5 space-y-2.5">
              {domain.careerPathways.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              These describe the kind of work the skills apply to. Roystian
              Foundation does not promise placement into any role.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section border-b border-border bg-muted/25">
        <div className="container">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Curriculum
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {domain.curriculumSource === "demo"
                ? "This is a demo curriculum created for the demonstration environment. It is written for learning purposes and does not represent any external accreditation."
                : "Each module pairs written learning material with key concepts, downloadable resources and a short assessment."}
            </p>
          </Reveal>

          <ol className="mt-9 grid gap-4 sm:grid-cols-2">
            {domain.modules.map((module, index) => (
              <Reveal key={module.id} delay={(index % 2) * 0.05} as="li">
                <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">
                      Module {String(module.number).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {module.readMinutes} min read
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-[0.95rem] font-semibold text-foreground">
                    {module.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {module.summary}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {module.concepts.slice(0, 3).map((concept) => (
                      <span
                        key={concept.term}
                        className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                      >
                        {concept.term}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Practical activity */}
      <section className="section border-b border-border">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Practical activity
              </h2>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {domain.practicalTask.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {domain.practicalTask.brief}
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Deliverable
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {domain.practicalTask.deliverable}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Requirements</h3>
              </div>
              <ol className="mt-4 space-y-3">
                {domain.practicalTask.requirements.map((req, index) => (
                  <li key={req} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-mono text-xs text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Evaluated on
                </p>
                <ul className="mt-2 space-y-1.5">
                  {domain.practicalTask.evaluation.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Levels */}
      <section className="section border-b border-border bg-muted/25">
        <div className="container">
          <Reveal>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Available experience levels
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Pick the level that matches your current experience. You can change it
              during onboarding.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {levels.map((level, index) => (
              <Reveal key={level.value} delay={index * 0.06}>
                <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <h3 className="text-[0.95rem] font-semibold text-foreground">
                    {level.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {level.description}
                  </p>
                  <dl className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Difficulty</dt>
                      <dd className="font-medium text-foreground">{level.difficulty}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Estimated effort</dt>
                      <dd className="font-medium text-foreground">{level.effort}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Available Programs"
            title={`Two ways to complete the ${domain.shortName} track.`}
            description={`Both programmes cover the ${domain.name} track in full. Industry-Led adds video lessons and live sessions with ${trainer.name} (demo trainer profile), mentor interaction and career guidance.`}
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {PROGRAMS.map((program, index) => (
              <Reveal key={program.id} delay={index * 0.08}>
                <ProgramCard
                  program={program}
                  href={`/start?domain=${domain.id}&program=${program.id}`}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        image={IMAGES.certificateAchievement}
        title={[`Start the ${domain.shortName} internship.`]}
        description="Pick your experience level, choose a programme, and begin. The certificate unlocks once every completion requirement is met."
        primary={{
          label: "Start this internship",
          href: `/start?domain=${domain.id}`,
        }}
        secondary={{ label: "Browse all domains", href: "/domains" }}
      />
    </SiteShell>
  );
}
