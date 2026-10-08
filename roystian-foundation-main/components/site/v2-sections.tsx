import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  Handshake,
  Heart,
  LineChart,
  MessagesSquare,
  Scale,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  01 · The Student Problem                                           */
/* ------------------------------------------------------------------ */

export function StudentProblem() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
      <Reveal>
        <SectionHeading
          eyebrow="The Student Problem"
          title={
            <>
              A degree is important. But students also need{" "}
              <span className="text-primary">evidence</span>.
            </>
          }
          description="Students often need more than academic qualifications to demonstrate readiness for professional opportunities. They need practical exposure, projects, demonstrable skills, professional profiles, interview preparation, career guidance, and industry-oriented experience."
        />
        <Reveal delay={0.1}>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <FileText
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold">Roystian&rsquo;s role:</span> turn
              learning into demonstrable career evidence.
            </p>
          </div>
        </Reveal>
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {[
          {
            icon: GraduationCap,
            title: "Skills & Practical Work",
            body: "Domain knowledge, hands-on assignments and real projects.",
          },
          {
            icon: LineChart,
            title: "Performance Evidence",
            body: "Assessments, a career portfolio and a verified certificate.",
          },
          {
            icon: Briefcase,
            title: "Career Readiness",
            body: "Resume, LinkedIn profile and mock interview experience.",
          },
        ].map((item) => (
          <Reveal key={item.title} child>
            <div className="lift-card flex h-full gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[0.95rem] font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </Stagger>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The five audiences the homepage must answer                        */
/* ------------------------------------------------------------------ */

const AUDIENCES = [
  {
    icon: UserRound,
    audience: "Students",
    question: "What will I actually get?",
    answer:
      "Assessed skills, real projects, a shareable Career Passport and a verifiable certificate.",
    href: "/for-students",
  },
  {
    icon: Heart,
    audience: "Parents",
    question: "Is this legitimate and useful?",
    answer:
      "A Section 8 non-profit with transparent pricing, published terms and QR-verifiable certificates.",
    href: "/about",
  },
  {
    icon: Building2,
    audience: "Colleges",
    question: "Why should we partner?",
    answer:
      "Structured internships plus live cohort analytics and skill gap reporting for your placement cell.",
    href: "/colleges",
  },
  {
    icon: Handshake,
    audience: "Industry & Startups",
    question: "What talent is being developed?",
    answer:
      "Students with evaluated project evidence, not just certificates — discoverable through public profiles.",
    href: "/opportunities",
  },
  {
    icon: Trophy,
    audience: "Foundation & Partners",
    question: "What impact is being created?",
    answer:
      "Scalable pathways from classroom learning to paid industry experience, measured end to end.",
    href: "/about#impact",
  },
];

export function AudienceGrid() {
  return (
    <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {AUDIENCES.map((item) => (
        <Reveal key={item.audience} child>
          <Link
            href={item.href}
            className="lift-card group flex h-full flex-col rounded-2xl border border-border border-l-2 border-l-primary bg-card p-6 shadow-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
              {item.audience}
            </h3>
            <p className="mt-1.5 text-sm font-medium italic text-muted-foreground">
              &ldquo;{item.question}&rdquo;
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-primary">
              Read more
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </Reveal>
      ))}
    </Stagger>
  );
}

/* ------------------------------------------------------------------ */
/*  07 · Career Passport                                               */
/* ------------------------------------------------------------------ */

export function CareerPassportSection() {
  return (
    <div>
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Career Passport"
          title="Your career evidence. In one place."
          description="Every student builds a digital Career Passport — a single, shareable record of their professional development, published at a public profile link."
        />
      </Reveal>

      <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: UserRound,
            title: "Profile & Experience",
            body: "Name, education and internship experience.",
          },
          {
            icon: BadgeCheck,
            title: "Skills & Certificates",
            body: "Verified skills, credentials and earned badges.",
          },
          {
            icon: FileText,
            title: "Projects & Evidence",
            body: "Completed work, assessments and a career readiness summary.",
          },
        ].map((item) => (
          <Reveal key={item.title} child>
            <div className="lift-card h-full rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          </Reveal>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Designed for sharing on LinkedIn, in a resume, over email, in job
          applications and through PehlaChance.
        </p>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  08 · Career Readiness                                              */
/* ------------------------------------------------------------------ */

/** Illustrative only — the real score is computed from a student's activity. */
const SAMPLE_AREAS = [
  { label: "Technical Skills", score: 82 },
  { label: "Problem Solving", score: 81 },
  { label: "Project Execution", score: 79 },
  { label: "Practical Application", score: 76 },
  { label: "Communication", score: 74 },
];

export function CareerReadinessSection() {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
      <Reveal>
        <SectionHeading
          eyebrow="Career Readiness"
          title="How career ready are you?"
          description="A single score, measured across five areas and derived from your actual platform activity — assessments you sat, projects you submitted, interviews you completed."
        />

        <Reveal delay={0.1}>
          <div className="mt-8 space-y-4">
            <div>
              <p className="eyebrow mb-2">Your strengths</p>
              <p className="text-sm text-muted-foreground">
                The areas where your evidence is strongest, named explicitly.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">Improve next</p>
              <p className="text-sm text-muted-foreground">
                The weakest areas, each with the specific action that lifts it.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The score reflects platform activity and assessment data. It is not
              a guarantee of employment and is never presented as one.
            </p>
          </div>
        </Reveal>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="rounded-2xl border border-border bg-card p-7 shadow-soft">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Sample breakdown</p>
            <p className="font-display text-3xl font-semibold text-foreground">
              78
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / 100
              </span>
            </p>
          </div>

          <div className="mt-6 space-y-3.5">
            {SAMPLE_AREAS.map((area, index) => (
              <div key={area.label}>
                <div className="flex items-baseline justify-between text-[0.8rem]">
                  <span className="text-muted-foreground">{area.label}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {area.score}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary",
                      index === 0 && "opacity-100",
                      index === 1 && "opacity-90",
                      index === 2 && "opacity-80",
                      index === 3 && "opacity-70",
                      index === 4 && "opacity-60",
                    )}
                    style={{ width: `${area.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 border-t border-border pt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
            Illustrative figures. Your own score is computed from your work.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  09 · Advanced Internship Opportunities                             */
/* ------------------------------------------------------------------ */

export function AdvancedOpportunitySection() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-16">
      <Reveal>
        <SectionHeading
          eyebrow="Advanced Internship Pathway"
          tone="invert"
          title="Perform. Get selected. Get industry experience."
          description="High-performing students may be shortlisted for a 3-month paid offline internship through the Roystian technology ecosystem in Hyderabad. Potential areas include AI & Technology, Software Development, Automation, Sustainability, Research & Innovation, and Business Operations."
        />

        <Reveal delay={0.12}>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/20 bg-white/5 p-4">
            <Scale
              className="mt-0.5 h-4 w-4 shrink-0 text-white/70"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-white/75">
              Selection is based on applicable assessments, project performance,
              interview, availability and eligibility. Shortlisting is not
              guaranteed by completing the programme.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <Button asChild size="lg" className="group mt-8 bg-white text-ink-surface hover:bg-white/90">
            <Link href="/opportunities/advanced-internship">
              See how selection works <ArrowRight className="cta-arrow" />
            </Link>
          </Button>
        </Reveal>
      </Reveal>

      <Stagger className="grid gap-3">
        {[
          "Complete your internship",
          "Pass every assessment",
          "Submit a structured project",
          "Enter an industry challenge",
        ].map((step, index) => (
          <Reveal key={step} child>
            <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/[0.06] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[0.9rem] font-medium text-white">{step}</p>
            </div>
          </Reveal>
        ))}
        <Reveal child>
          <p className="mt-2 text-center font-display text-lg font-semibold text-white/90">
            The opportunity is earned.
          </p>
        </Reveal>
      </Stagger>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  12 · Impact & Trust                                                */
/* ------------------------------------------------------------------ */

/**
 * The PRD forbids placeholder impact numbers on the public site. So this
 * section shows the trust commitments — each of which is a real, checkable
 * property of the platform — rather than invented counts. Live figures go in
 * once the system is operational.
 */
export function ImpactTrustSection() {
  const commitments = [
    {
      icon: Building2,
      title: "Section 8 Organisation",
      body: "Roystian Foundation is a registered non-profit, clearly identified on every page.",
    },
    {
      icon: FileText,
      title: "Program Information",
      body: "Clear pricing and transparent selection criteria, stated before payment.",
    },
    {
      icon: BadgeCheck,
      title: "Certificate Verification",
      body: "Every certificate carries a QR-enabled public verification page.",
    },
    {
      icon: Scale,
      title: "Internship Terms",
      body: "Terms explained in full, with the refund and cancellation policy published.",
    },
    {
      icon: ShieldCheck,
      title: "Legal Pages",
      body: "Privacy Policy and Terms & Conditions available from every page.",
    },
    {
      icon: MessagesSquare,
      title: "No Placement Claims",
      body: "We never promise employment. Opportunity is described as earned, never guaranteed.",
    },
  ];

  return (
    <div>
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Impact & Trust"
          title="Built for transparency."
          description="Everything below is checkable today. Verified impact figures will be published here once the platform is operational — we will not show placeholder numbers."
        />
      </Reveal>

      <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {commitments.map((item) => (
          <Reveal key={item.title} child>
            <div className="lift-card flex h-full gap-4 rounded-2xl border border-border border-l-2 border-l-primary bg-card p-5 shadow-soft">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </Stagger>
    </div>
  );
}
