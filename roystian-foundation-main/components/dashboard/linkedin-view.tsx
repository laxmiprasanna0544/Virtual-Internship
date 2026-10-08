"use client";

import * as React from "react";
import { Check, Copy, Linkedin, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getProject } from "@/data/projects";
import { linkedInFor, saveLinkedIn, useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { delay } from "@/lib/api";
import type { LinkedInSection } from "@/types";

const SECTIONS: {
  key: LinkedInSection;
  label: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "headline",
    label: "Headline",
    hint: "220 characters. Lead with what you can do, then the field.",
    rows: 2,
  },
  {
    key: "about",
    label: "About",
    hint: "Two to three short paragraphs. First person, no third-person bio voice.",
    rows: 8,
  },
  {
    key: "internship",
    label: "Internship description",
    hint: "What the programme involved and what you produced.",
    rows: 6,
  },
  {
    key: "project",
    label: "Project description",
    hint: "Problem, approach, result. Keep the result concrete.",
    rows: 6,
  },
  {
    key: "skills",
    label: "Skills",
    hint: "Only skills your assessments and projects support.",
    rows: 3,
  },
  {
    key: "achievements",
    label: "Achievements",
    hint: "Assessed outcomes and verifiable credentials.",
    rows: 5,
  },
];

export function LinkedInView() {
  const { ready, student, domain, program, certificate, summary } =
    useStudentContext();
  const career = useCareerContext();

  const [drafts, setDrafts] = React.useState<Record<LinkedInSection, string>>({
    headline: "",
    about: "",
    internship: "",
    project: "",
    skills: "",
    achievements: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  /**
   * Generates suggested copy from the student's actual record. Nothing here is
   * invented — every claim traces to a module, an assessment or a project.
   */
  const generate = React.useCallback((): Record<LinkedInSection, string> => {
    const domainName = domain?.name ?? "your domain";
    const first = student?.name?.split(" ")[0] ?? "I";

    const evaluated = career.projects.filter((p) => p.status === "evaluated");
    const topProject = evaluated
      .slice()
      .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))[0];
    const brief = topProject ? getProject(topProject.projectId) : undefined;

    const badgeNames = career.earnedBadges.map((b) => b.displayName);

    return {
      headline: domain
        ? `${domainName} | ${program?.marketingName ?? "Virtual Internship"} at Roystian Foundation | Building practical, assessed skills`
        : "Student | Roystian Foundation",

      about: [
        `I am working through the ${domainName} virtual internship at Roystian Foundation, a Section 8 non-profit focused on practical skill development.`,
        `So far I have completed ${summary.modulesCompleted} of ${summary.moduleTotal} structured learning modules and passed ${summary.assessmentsPassed} of ${summary.assessmentTotal} assessments${summary.finalPassed ? `, including the final assessment at ${summary.finalPercentage}%` : ""}.`,
        brief
          ? `My main project, ${brief.title}, involved ${brief.problemStatement.charAt(0).toLowerCase()}${brief.problemStatement.slice(1)}`
          : "I am currently working through an industry-style project brief with documented analysis and recommendations.",
        `I am looking for opportunities where I can apply ${domainName.toLowerCase()} to real problems.`,
      ].join("\n\n"),

      internship: [
        `${program?.name ?? "Virtual Internship"} — Roystian Foundation`,
        ``,
        `A structured 15-day ${domainName} programme covering ${summary.moduleTotal} learning modules, each assessed at a 70% pass threshold, plus a practical activity and an industry-style project.`,
        ``,
        `• Completed ${summary.modulesCompleted} of ${summary.moduleTotal} modules`,
        `• Passed ${summary.assessmentsPassed} of ${summary.assessmentTotal} module assessments`,
        summary.finalPassed
          ? `• Passed the final assessment at ${summary.finalPercentage}%`
          : `• Working toward the final assessment`,
        evaluated.length
          ? `• Delivered ${evaluated.length} evaluated project${evaluated.length === 1 ? "" : "s"}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),

      project: brief
        ? [
            brief.title,
            ``,
            `Problem: ${brief.problemStatement}`,
            ``,
            `Approach: ${brief.requirements.slice(0, 3).join("; ")}.`,
            ``,
            topProject?.overallScore != null
              ? `Outcome: evaluated at ${topProject.overallScore}% against published criteria covering ${brief.evaluationCriteria.map((c) => c.label.toLowerCase()).join(", ")}.`
              : `Outcome: submitted for evaluation against published criteria.`,
            ``,
            `Skills: ${brief.skillsDemonstrated.join(", ")}`,
          ].join("\n")
        : "Complete and submit a project to generate this section.",

      skills: badgeNames.length
        ? badgeNames.join("\n")
        : "Earn skill badges to populate this section with skills your assessments support.",

      achievements: [
        summary.finalPassed
          ? `Passed the ${domainName} final assessment at ${summary.finalPercentage}%`
          : "",
        career.earnedBadges.length
          ? `Earned ${career.earnedBadges.length} Roystian skill badge${career.earnedBadges.length === 1 ? "" : "s"}`
          : "",
        career.readiness.score >= 60
          ? `Career Readiness Score of ${career.readiness.score}/100 across five assessed areas`
          : "",
        certificate
          ? `Roystian Foundation internship certificate — ${certificate.id} (independently verifiable)`
          : "",
      ]
        .filter(Boolean)
        .join("\n") || "Complete assessments and projects to generate achievements.",
    };
  }, [domain, student, program, summary, certificate, career]);

  React.useEffect(() => {
    if (hydrated || !student || !career.ready) return;
    const stored = linkedInFor(student.id);
    setDrafts(stored ? stored.sections : generate());
    setHydrated(true);
  }, [student, career.ready, hydrated, generate]);

  if (!ready || !career.ready) {
    return <LoadingState label="Preparing your profile copy" rows={3} />;
  }

  async function handleSave() {
    if (!student) return;
    setBusy(true);
    await delay(350);
    saveLinkedIn(student.id, drafts);
    setBusy(false);
    toast.success("LinkedIn draft saved");
  }

  function handleRegenerate() {
    setDrafts(generate());
    toast.success("Regenerated from your latest record");
  }

  async function copySection(key: LinkedInSection, label: string) {
    await navigator.clipboard.writeText(drafts[key]);
    toast.success(`${label} copied`);
  }

  return (
    <div>
      <PageHeader
        title="LinkedIn Profile Builder"
        description="Suggested copy for every section, written from your actual record. Edit anything — these are drafts, not final text."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw /> Regenerate
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check /> Save
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
        <Linkedin
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
          Every claim below is drawn from work recorded on the platform. If a
          section reads thin, the fix is more evidence rather than stronger
          wording — regenerate after you complete a project or an assessment.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <section
            key={section.key}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[0.95rem] font-semibold text-foreground">
                  {section.label}
                </h2>
                <p className="mt-1 text-[0.76rem] leading-relaxed text-muted-foreground">
                  {section.hint}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => copySection(section.key, section.label)}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>

            <Textarea
              className="mt-4 font-sans"
              rows={section.rows}
              value={drafts[section.key]}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [section.key]: e.target.value }))
              }
            />
            <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
              {drafts[section.key].length} characters
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
