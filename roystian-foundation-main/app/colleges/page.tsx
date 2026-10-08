import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, QrCode } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { SectionHeading } from "@/components/site/section";
import {
  CampusDashboardPreview,
  SkillGapPreview,
} from "@/components/site/campus-preview";
import { CollegeEnquiryForm } from "@/components/site/college-form";
import { DynamicIcon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { COLLEGE_OFFERINGS } from "@/data/content";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "For Colleges",
  description:
    "Run internship drives, technology workshops, career sessions and employability programmes with Roystian Foundation.",
};

export default function CollegesPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.collegePartnership}
        size="tall"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "For Colleges" }]}
        eyebrow="College Partnerships"
        title={["Build career-ready", "students with us."]}
        description="Structured internship and skill programmes your placement cell can deploy across an entire batch, with visibility into who is progressing and who needs support."
        actions={
          <>
            <Button asChild size="xl">
              <Link href="#enquiry">Partner With Roystian</Link>
            </Button>
            <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
              <Link href="/college-internships">
                <QrCode /> View the QR landing page
              </Link>
            </Button>
          </>
        }
      />

      <section id="programs" className="section scroll-mt-20 border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="What We Run"
            title="Four programmes your placement cell can deploy."
            description="Each one is delivered end to end, with reporting back to your department."
          />
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2">
            {COLLEGE_OFFERINGS.map((offering) => (
              <Reveal key={offering.id} child>
                <div
                  id={offering.id}
                  className="lift-card h-full scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <DynamicIcon name={offering.icon} className="h-[1.1rem] w-[1.1rem]" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-foreground">
                    {offering.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {offering.body}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {offering.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                          aria-hidden="true"
                        />
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Campus dashboard ─────────────────────────────────────────── */}
      <section
        id="dashboard"
        className="section scroll-mt-20 border-b border-border bg-muted/30"
      >
        <div className="container">
          <CampusDashboardPreview />
        </div>
      </section>

      {/* ── Skill gap report ─────────────────────────────────────────── */}
      <section
        id="skill-gap"
        className="section scroll-mt-20 border-b border-border"
      >
        <div className="container">
          <SkillGapPreview />
        </div>
      </section>

      <section
        id="collaborate"
        className="surface-ink section relative scroll-mt-20 overflow-hidden border-b border-white/10"
      >
        <ParallaxImage
          image={IMAGES.studentCommunity}
          alt=""
          strength={10}
          sizes="100vw"
          className="absolute inset-0 opacity-[0.2]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink-surface via-ink-surface/90 to-ink-surface/60"
          aria-hidden="true"
        />
        <div className="container relative">
          <SectionHeading
            animate
            tone="invert"
            eyebrow="Organizations"
            title="Collaborate with us"
            description="Organisations, NGOs and community groups can work with the Foundation on skills delivery, applied research and technology projects. Use the enquiry form below and tell us what you have in mind."
          />
        </div>
      </section>

      <section id="enquiry" className="section scroll-mt-20">
        <span id="partner" className="sr-only" aria-hidden="true" />
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <Reveal>
            <SectionHeading
              eyebrow="Enquiry"
              title="Start the conversation"
              description="Share a few details and the programme team will follow up with options, timelines and what is required from your side."
            />
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              {[
                "No minimum batch size for workshops",
                "Programme reporting shared with your placement cell",
                "Every student receives an individually verifiable credential",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <CollegeEnquiryForm />
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
