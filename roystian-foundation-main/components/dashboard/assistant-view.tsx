"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bot, Info, Send, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDomain } from "@/data/domains";
import { getProject } from "@/data/projects";
import { challengesForDomain } from "@/data/challenges";
import { useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { demonstratedSkills } from "@/lib/readiness";
import { cn } from "@/lib/utils";
import type { CareerContext } from "@/lib/career";
import type { StudentContext } from "@/lib/use-student";

/**
 * Career Assistant.
 *
 * There is no language model behind this. It answers a fixed set of career
 * questions by reading the student's own records and stating what they
 * actually show. That is a narrower product than a chatbot, but it has one
 * property a chatbot does not: it cannot invent an achievement the student
 * has not earned. The UI says so plainly rather than implying otherwise.
 */

interface Answer {
  body: string[];
  actions?: { label: string; href: string }[];
}

interface Topic {
  id: string;
  question: string;
  answer: (ctx: StudentContext, career: CareerContext) => Answer;
}

const TOPICS: Topic[] = [
  {
    id: "careers",
    question: "What careers match my skills?",
    answer: (ctx) => {
      const domain = getDomain(ctx.student?.domainId);
      if (!domain) {
        return {
          body: [
            "You have not chosen a domain yet, so there is nothing to match against.",
          ],
          actions: [{ label: "Choose a domain", href: "/start/domain" }],
        };
      }
      return {
        body: [
          `Your track is ${domain.name}. The skills it builds apply most directly to these pathways:`,
          ...domain.careerPathways.map((p) => `• ${p}`),
          "These describe the kind of work the skills support. Roystian Foundation does not promise placement into any role.",
        ],
        actions: [
          { label: "See the full domain page", href: `/internships/${domain.id}` },
        ],
      };
    },
  },
  {
    id: "resume",
    question: "How do I improve my resume?",
    answer: (ctx, career) => {
      const gaps: string[] = [];
      if (career.projects.filter((p) => p.status === "evaluated").length === 0) {
        gaps.push(
          "• You have no evaluated project yet. A project with documented analysis is the single strongest line on an intern resume.",
        );
      }
      if (career.earnedBadges.length < 3) {
        gaps.push(
          `• You have ${career.earnedBadges.length} skill badge${career.earnedBadges.length === 1 ? "" : "s"}. Badges give your skills section evidence rather than assertions.`,
        );
      }
      if (!ctx.certificate) {
        gaps.push(
          "• Your certificate has not been issued yet. It is the credential a recruiter can verify independently.",
        );
      }
      if (ctx.summary.assessmentsPassed < ctx.summary.assessmentTotal) {
        gaps.push(
          `• ${ctx.summary.assessmentTotal - ctx.summary.assessmentsPassed} assessments remain. Completed assessments become concrete bullet points.`,
        );
      }

      return {
        body: gaps.length
          ? ["Based on what is currently on your record:", ...gaps]
          : [
              "Your record is strong across the board — evaluated projects, badges, assessments and a certificate.",
              "At this point the improvement is editorial rather than evidential: lead the summary with what you can do, and make every project bullet end in a result.",
            ],
        actions: [{ label: "Open the resume builder", href: "/dashboard/resume" }],
      };
    },
  },
  {
    id: "interview",
    question: "How do I prepare for an interview?",
    answer: (ctx, career) => {
      const done = career.interviews.length;
      const weakest = career.readiness.breakdown
        .slice()
        .sort((a, b) => a.score - b.score)[0];

      if (done === 0) {
        return {
          body: [
            "You have not run a mock interview yet, so the platform has no read on how you communicate.",
            "Start with the HR interview — it is the one every process includes, and the questions are the same everywhere.",
            "Write your answers as you would say them. Aim for 60 to 150 words each.",
          ],
          actions: [
            { label: "Start a mock interview", href: "/dashboard/interview" },
          ],
        };
      }

      const avg = Math.round(
        career.interviews.reduce((s, i) => s + i.overallScore, 0) / done,
      );

      return {
        body: [
          `You have completed ${done} session${done === 1 ? "" : "s"}, averaging ${avg}/100.`,
          weakest
            ? `Your weakest readiness area is ${weakest.label} at ${weakest.score}. ${weakest.basis}`
            : "",
          "Before a real interview, run the Project interview once — being able to defend your own work is what separates a rehearsed candidate from a credible one.",
        ].filter(Boolean),
        actions: [
          { label: "Run another session", href: "/dashboard/interview" },
        ],
      };
    },
  },
  {
    id: "next",
    question: "What should I learn next?",
    answer: (ctx, career) => {
      if (ctx.nextModule) {
        return {
          body: [
            `Your next module is "${ctx.nextModule.title}".`,
            ctx.nextModule.summary,
            `You have completed ${ctx.summary.modulesCompleted} of ${ctx.summary.moduleTotal} modules so far.`,
          ],
          actions: [
            {
              label: "Open the module",
              href: `/dashboard/learning/${ctx.nextModule.id}`,
            },
          ],
        };
      }

      const openBrief = career.briefs.find(
        (b) => !career.projects.some((p) => p.projectId === b.id),
      );
      if (openBrief) {
        return {
          body: [
            "You have finished the learning modules. The next thing worth your time is a project.",
            `"${openBrief.title}" — ${openBrief.scenario}`,
          ],
          actions: [
            {
              label: "Open the brief",
              href: `/dashboard/projects/${openBrief.id}`,
            },
          ],
        };
      }

      const { recommended } = challengesForDomain(ctx.student?.domainId);
      if (recommended.length && career.challenges.length === 0) {
        return {
          body: [
            "Modules and projects are done. An industry challenge is the next step up — open-ended, with no given method.",
            `"${recommended[0].title}" — ${recommended[0].summary}`,
          ],
          actions: [
            { label: "See challenges", href: "/dashboard/challenges" },
          ],
        };
      }

      return {
        body: [
          "You have worked through the structured material, a project and a challenge.",
          "The remaining gains are in your weakest readiness areas rather than in new content.",
        ],
        actions: [
          { label: "See your readiness breakdown", href: "/dashboard/readiness" },
        ],
      };
    },
  },
  {
    id: "readiness",
    question: "Why is my readiness score what it is?",
    answer: (ctx, career) => {
      const lines = career.readiness.breakdown.map(
        (area) => `• ${area.label} — ${area.hasEvidence ? area.score : "no evidence yet"}. ${area.basis}`,
      );
      return {
        body: [
          `Your score is ${career.readiness.score}/100, weighted across five areas:`,
          ...lines,
          "Areas without evidence are not counted as zero out of spite — they simply have nothing to measure yet.",
        ],
        actions: [
          { label: "Open the full breakdown", href: "/dashboard/readiness" },
        ],
      };
    },
  },
  {
    id: "opportunity",
    question: "How do I qualify for the paid internship?",
    answer: (ctx, career) => {
      return {
        body: [
          "The Advanced Internship Pathway opens once you have completed the internship, passed every assessment, submitted a project, entered an industry challenge and reached a readiness score of 70.",
          `You are at ${career.readiness.score} readiness with ${career.projects.filter((p) => p.status !== "not-started").length} project${career.projects.filter((p) => p.status !== "not-started").length === 1 ? "" : "s"} and ${career.challenges.length} challenge entr${career.challenges.length === 1 ? "y" : "ies"}.`,
          "Meeting all five makes you eligible to apply. Selection also considers interview, availability and eligibility, and is never guaranteed.",
        ],
        actions: [
          { label: "Check your eligibility", href: "/dashboard/fellowship" },
        ],
      };
    },
  },
  {
    id: "skills",
    question: "What skills can I honestly claim?",
    answer: (ctx, career) => {
      const skills = demonstratedSkills(ctx.student, ctx.progress);
      const badges = career.earnedBadges.map((b) => b.displayName);

      if (skills.length === 0 && badges.length === 0) {
        return {
          body: [
            "Nothing yet — a skill becomes claimable here once you pass its assessment at 80% or above, or earn a badge tied to real performance.",
            "That threshold exists so that anything on your profile survives being questioned in an interview.",
          ],
          actions: [
            { label: "Go to assessments", href: "/dashboard/assessments" },
          ],
        };
      }

      return {
        body: [
          "These are backed by assessment or project evidence on your record:",
          ...[...new Set([...badges, ...skills])].map((s) => `• ${s}`),
          "Anything outside this list is not something the platform can vouch for.",
        ],
        actions: [{ label: "See your badges", href: "/dashboard/badges" }],
      };
    },
  },
];

interface Message {
  role: "user" | "assistant";
  text: string[];
  actions?: { label: string; href: string }[];
}

export function AssistantView() {
  const ctx = useStudentContext();
  const career = useCareerContext();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  if (!ctx.ready || !career.ready) {
    return <LoadingState label="Loading your assistant" rows={3} />;
  }

  function ask(topic: Topic) {
    const answer = topic.answer(ctx, career);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: [topic.question] },
      { role: "assistant", text: answer.body, actions: answer.actions },
    ]);
  }

  /** Free text is matched to the nearest topic by keyword overlap. */
  function handleFreeText(event: React.FormEvent) {
    event.preventDefault();
    const query = input.trim();
    if (!query) return;
    setInput("");

    const terms = query.toLowerCase().split(/[^a-z]+/).filter((t) => t.length > 3);
    const scored = TOPICS.map((topic) => {
      const haystack = topic.question.toLowerCase();
      return {
        topic,
        score: terms.filter((t) => haystack.includes(t)).length,
      };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0];

    if (!best || best.score === 0) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: [query] },
        {
          role: "assistant",
          text: [
            "I can only answer from what the platform records about your work, and that question is outside what I can check.",
            "Here is what I can answer — pick one and I will read your actual record:",
            ...TOPICS.map((t) => `• ${t.question}`),
          ],
        },
      ]);
      return;
    }

    const answer = best.topic.answer(ctx, career);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: [query] },
      { role: "assistant", text: answer.body, actions: answer.actions },
    ]);
  }

  return (
    <div>
      <PageHeader
        title="Career Assistant"
        description="Answers drawn from your own record — assessments you sat, projects you submitted, badges you earned."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
          This assistant is not a language model. It reads your platform records
          and reports what they show, which means it will never credit you with
          something you have not done — but it also only answers the questions
          listed below.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        {/* ── Topics ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-[0.95rem] font-semibold text-foreground">
            What I can answer
          </h2>
          <div className="mt-4 space-y-2">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => ask(topic)}
                className="group w-full rounded-xl border border-border px-4 py-3 text-left text-[0.85rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {topic.question}
                <ArrowRight
                  className="ml-2 inline h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>

        {/* ── Conversation ───────────────────────────────────────────── */}
        <section className="flex min-h-[28rem] flex-col rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[0.9rem] font-medium text-foreground">
                  Ask about your career evidence
                </p>
                <p className="mt-1.5 max-w-xs text-[0.82rem] leading-relaxed text-muted-foreground">
                  Pick a question on the left, or type one. Every answer is read
                  from your record.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "justify-end",
                  )}
                >
                  {message.role === "assistant" && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {message.text.map((line, i) => (
                      <p
                        key={i}
                        className={cn(
                          "text-[0.85rem] leading-relaxed",
                          i > 0 && "mt-2",
                          message.role === "user"
                            ? "text-primary-foreground"
                            : "text-foreground",
                        )}
                      >
                        {line}
                      </p>
                    ))}

                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <Button
                            key={action.href}
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <Link href={action.href}>{action.label}</Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={handleFreeText}
            className="flex gap-2 border-t border-border p-4"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your skills, resume, interviews or next steps…"
              aria-label="Ask the career assistant"
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
