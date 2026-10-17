import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Linkedin,
  MessagesSquare,
  Trophy,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero, heroOutlineButton } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import {
  CareerPassportSection,
  CareerReadinessSection,
} from "@/components/site/v2-sections";
import { Button } from "@/components/ui/button";
import { BADGES } from "@/data/badges";
import { INTERVIEW_KINDS } from "@/data/interviews";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Career Passport, projects, assessments, career readiness, resume and LinkedIn builders, and mock interviews.",
};

const TOOLS = [
  {
    id: "projects",
    icon: FolderKanban,
    title: "Real-World Projects",
    body: "Industry-style briefs — you receive a problem statement, a dataset, requirements and the evaluation criteria, and you produce analysis, recommendations and a report.",
  },
  {
    id: "assessments",
    icon: ClipboardCheck,
    title: "Assessments",
    body: "A short assessment after every module and a final assessment, each passed at 70% or above, with up to five attempts a day.",
  },
  {
    id: "resume",
    icon: FileText,
    title: "Resume Builder",
    body: "Your platform activity becomes an ATS-friendly resume — domain skills, detailed project descriptions, internship experience and achievements.",
  },
  {
    id: "linkedin",
    icon: Linkedin,
    title: "LinkedIn Profile Builder",
    body: "Support for every section: headline, about, internship description, project description, skills and achievements.",
  },
  {
    id: "interview",
    icon: MessagesSquare,
    title: "Mock Interview Centre",
    body: "Technical, HR and project interviews, each followed by written feedback, areas to improve and practice recommendations.",
  },
  {
    id: "assistant",
    icon: Bot,
    title: "AI Career Assistant",
    body: "Ask what careers match your skills, how to improve your resume, how to prepare for an interview, or what to learn next.",
  },
];

export default function ForStudentsPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.studentDashboard}
        eyebrow="For Students"
        title={["Build skills.", "Build projects.", "Build your profile."]}
        description="Everything the platform gives you beyond the certificate — the evidence, the tools and the preparation that turn a completed internship into something you can show."
        breadcrumbs={[{ label: "For Students" }]}
        actions={
          <>
            <Button asChild size="lg" className="group">
              <Link href="/start">
                Start your internship <ArrowRight className="cta-arrow" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={heroOutlineButton}>
              <Link href="/dashboard">Go to your dashboard</Link>
            </Button>
          </>
        }
      />

      {/* ── Career Passport ──────────────────────────────────────────── */}
      <section id="passport" className="section border-b border-border">
        <div className="container">
          <CareerPassportSection />
        </div>
      </section>

      {/* ── Career Readiness ─────────────────────────────────────────── */}
      <section
        id="readiness"
        className="section border-b border-border bg-muted/30"
      >
        <div className="container">
          <CareerReadinessSection />
        </div>
      </section>

      {/* ── The career toolkit ───────────────────────────────────────── */}
      <section className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Career Tools"
            title="Turn your experience into a professional profile."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Reveal key={tool.id} child>
                <div
                  id={tool.id}
                  className="lift-card flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <tool.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[0.98rem] font-semibold text-foreground">
                    {tool.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tool.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Mock interviews ──────────────────────────────────────────── */}
      <section className="section border-b border-border bg-muted/30">
        <div className="container">
          <SectionHeading
            animate
            eyebrow="Mock Interview Centre"
            title="Practise before the real interview."
            description="Three formats, each with written feedback on clarity, structure and depth — plus the specific things to work on before the next attempt."
          />

          <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
            {INTERVIEW_KINDS.map((kind) => (
              <Reveal key={kind.kind} child>
                <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="text-[0.98rem] font-semibold text-foreground">
                    {kind.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {kind.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Skill badges ─────────────────────────────────────────────── */}
      <section id="badges" className="section border-b border-border">
        <div className="container">
          <SectionHeading
            animate
            align="center"
            eyebrow="Skill Badges"
            title="Your skills. Your evidence."
            description="Badges are earned from demonstrated performance — connected to actual assessments, projects and activities. None of them are awarded automatically."
          />

          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => (
              <Reveal key={badge.id} child>
                <div className="lift-card flex h-full gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning-ink">
                    <Trophy className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[0.92rem] font-semibold text-foreground">
                      {badge.name}
                    </h3>
                    <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
                      {badge.description}
                    </p>
                    <p className="mt-2.5 flex items-start gap-1.5 text-[0.76rem] leading-relaxed text-primary">
                      <BadgeCheck
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {badge.criteria}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand
        image={IMAGES.careerOpportunities}
        title={["Don't just say you have skills.", "Show them."]}
        description="Every assessment you pass, project you submit and interview you complete becomes part of a record you can share."
        primary={{ label: "Start your internship", href: "/start" }}
        secondary={{ label: "See the opportunities", href: "/opportunities" }}
      />
    </SiteShell>
  );
}
