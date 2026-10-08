"use client";

import * as React from "react";
import { Copy, Download, FileSignature, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getProject } from "@/data/projects";
import { resumeFor, saveResume, useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { demonstratedSkills } from "@/lib/readiness";
import { delay } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/**
 * Resume builder.
 *
 * The resume is assembled from records the student actually produced, so it
 * cannot claim anything the platform cannot evidence. The student controls
 * the narrative parts (headline, summary) and which evidence sections appear.
 */
export function ResumeView() {
  const { ready, student, domain, program, certificate, summary, progress } =
    useStudentContext();
  const career = useCareerContext();

  const [headline, setHeadline] = React.useState("");
  const [summaryText, setSummaryText] = React.useState("");
  const [includeProjects, setIncludeProjects] = React.useState(true);
  const [includeAssessments, setIncludeAssessments] = React.useState(true);
  const [includeCertificate, setIncludeCertificate] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Module titles the student passed at 80%+ — the only skills the platform
  // can actually evidence.
  const skills = React.useMemo(
    () => demonstratedSkills(student, progress),
    [student, progress],
  );

  React.useEffect(() => {
    if (hydrated || !student) return;
    const stored = resumeFor(student.id);
    if (stored) {
      setHeadline(stored.headline);
      setSummaryText(stored.summary);
      setIncludeProjects(stored.includeProjects);
      setIncludeAssessments(stored.includeAssessments);
      setIncludeCertificate(stored.includeCertificate);
    } else if (domain) {
      setHeadline(`${domain.name} Intern`);
      setSummaryText(
        `${domain.name} intern at Roystian Foundation. Completed structured learning modules with assessed outcomes, delivered a practical activity, and produced an industry-style project with documented analysis and recommendations.`,
      );
    }
    setHydrated(true);
  }, [student, domain, hydrated]);

  if (!ready || !career.ready) {
    return <LoadingState label="Building your resume" rows={3} />;
  }

  const evaluatedProjects = career.projects.filter(
    (p) => p.status === "evaluated" || p.status === "submitted",
  );

  const badgeSkills = career.earnedBadges.map((b) => b.displayName);
  const allSkills = [...new Set([...badgeSkills, ...skills])].slice(0, 12);

  async function handleSave() {
    if (!student) return;
    setBusy(true);
    await delay(350);
    saveResume({
      studentId: student.id,
      headline,
      summary: summaryText,
      skills: allSkills,
      includeProjects,
      includeAssessments,
      includeCertificate,
      updatedAt: new Date().toISOString(),
    });
    setBusy(false);
    toast.success("Resume saved");
  }

  function buildPlainText(): string {
    const lines: string[] = [];
    lines.push(student?.name ?? "");
    lines.push(headline);
    if (student?.email) lines.push(student.email);
    if (student?.mobile) lines.push(student.mobile);
    lines.push("");

    lines.push("SUMMARY");
    lines.push(summaryText);
    lines.push("");

    if (allSkills.length) {
      lines.push("SKILLS");
      lines.push(allSkills.join(" · "));
      lines.push("");
    }

    lines.push("EXPERIENCE");
    lines.push(
      `${program?.name ?? "Virtual Internship"} — Roystian Foundation`,
    );
    if (domain) lines.push(`${domain.name} · 15 days`);
    lines.push(
      `- Completed ${summary.modulesCompleted} of ${summary.moduleTotal} structured learning modules`,
    );
    lines.push(
      `- Passed ${summary.assessmentsPassed} of ${summary.assessmentTotal} module assessments at 70% or above`,
    );
    if (summary.finalPassed) {
      lines.push(`- Passed the final assessment at ${summary.finalPercentage}%`);
    }
    lines.push("");

    if (includeProjects && evaluatedProjects.length) {
      lines.push("PROJECTS");
      for (const submitted of evaluatedProjects) {
        const brief = getProject(submitted.projectId);
        if (!brief) continue;
        lines.push(`${brief.title}`);
        lines.push(`  ${brief.problemStatement}`);
        lines.push(`  Skills: ${brief.skillsDemonstrated.join(", ")}`);
        if (submitted.overallScore != null) {
          lines.push(`  Evaluated at ${submitted.overallScore}%`);
        }
        lines.push("");
      }
    }

    if (includeCertificate && certificate) {
      lines.push("CERTIFICATIONS");
      lines.push(
        `${certificate.domainName} — ${certificate.programName}, Roystian Foundation`,
      );
      lines.push(
        `  Certificate ID ${certificate.id} · Issued ${formatDate(certificate.issueDate)}`,
      );
      lines.push("");
    }

    lines.push("EDUCATION");
    lines.push(`${student?.course ?? ""}`.trim());
    lines.push(`${student?.college ?? ""}`.trim());

    return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
  }

  async function copyResume() {
    await navigator.clipboard.writeText(buildPlainText());
    toast.success("Resume copied", {
      description: "Plain text, ready to paste into any editor.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Resume Builder"
        description="Your platform record, formatted for applicant tracking systems. Plain text, single column, no tables or graphics — the things that break ATS parsing."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyResume}>
              <Copy /> Copy
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ── Controls ───────────────────────────────────────────────── */}
        <div className="no-print space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <FileSignature className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Your words
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="resume-headline">Headline</Label>
                <Input
                  id="resume-headline"
                  className="mt-2"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="resume-summary">Summary</Label>
                <Textarea
                  id="resume-summary"
                  rows={6}
                  className="mt-2"
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                />
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted-foreground">
                  Three or four lines. Lead with what you can do, not what you
                  want.
                </p>
              </div>

              <Button onClick={handleSave} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Download /> Save resume
                  </>
                )}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Sections to include
            </h2>
            <div className="mt-4 divide-y divide-border">
              <ToggleRow
                label="Projects"
                detail={`${evaluatedProjects.length} on record`}
                checked={includeProjects}
                onChange={setIncludeProjects}
              />
              <ToggleRow
                label="Assessment results"
                detail={`${summary.assessmentsPassed} passed`}
                checked={includeAssessments}
                onChange={setIncludeAssessments}
              />
              <ToggleRow
                label="Certificate"
                detail={certificate ? certificate.id : "Not yet issued"}
                checked={includeCertificate}
                onChange={setIncludeCertificate}
              />
            </div>
          </section>
        </div>

        {/* ── Preview ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-7 shadow-soft sm:p-9">
          <div className="border-b border-border pb-5">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {student?.name}
            </h2>
            <p className="mt-1 text-[0.95rem] text-muted-foreground">{headline}</p>
            <p className="mt-2 text-[0.8rem] text-muted-foreground">
              {[student?.email, student?.mobile, student?.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <ResumeSection title="Summary">
            <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
              {summaryText}
            </p>
          </ResumeSection>

          {allSkills.length > 0 && (
            <ResumeSection title="Skills">
              <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
                {allSkills.join(" · ")}
              </p>
            </ResumeSection>
          )}

          <ResumeSection title="Experience">
            <p className="text-[0.88rem] font-semibold text-foreground">
              {program?.name ?? "Virtual Internship"} — Roystian Foundation
            </p>
            {domain && (
              <p className="text-[0.8rem] text-muted-foreground">
                {domain.name} · 15 days
              </p>
            )}
            <ul className="mt-2.5 space-y-1.5">
              <Bullet>
                Completed {summary.modulesCompleted} of {summary.moduleTotal}{" "}
                structured learning modules
              </Bullet>
              {includeAssessments && (
                <Bullet>
                  Passed {summary.assessmentsPassed} of{" "}
                  {summary.assessmentTotal} module assessments at 70% or above
                </Bullet>
              )}
              {includeAssessments && summary.finalPassed && (
                <Bullet>
                  Passed the final assessment at {summary.finalPercentage}%
                </Bullet>
              )}
            </ul>
          </ResumeSection>

          {includeProjects && evaluatedProjects.length > 0 && (
            <ResumeSection title="Projects">
              <div className="space-y-4">
                {evaluatedProjects.map((submitted) => {
                  const brief = getProject(submitted.projectId);
                  if (!brief) return null;
                  return (
                    <div key={submitted.id}>
                      <p className="text-[0.88rem] font-semibold text-foreground">
                        {brief.title}
                        {submitted.overallScore != null && (
                          <span className="ml-2 font-mono text-[0.78rem] font-normal text-muted-foreground">
                            {submitted.overallScore}%
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
                        {brief.problemStatement}
                      </p>
                      <p className="mt-1 text-[0.78rem] text-muted-foreground">
                        Skills: {brief.skillsDemonstrated.join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ResumeSection>
          )}

          {includeCertificate && certificate && (
            <ResumeSection title="Certifications">
              <p className="text-[0.85rem] text-foreground">
                {certificate.domainName} — {certificate.programName}, Roystian
                Foundation
              </p>
              <p className="mt-1 font-mono text-[0.76rem] text-muted-foreground">
                {certificate.id} · Issued {formatDate(certificate.issueDate)}
              </p>
            </ResumeSection>
          )}

          <ResumeSection title="Education">
            <p className="text-[0.85rem] font-medium text-foreground">
              {student?.course}
            </p>
            <p className="text-[0.82rem] text-muted-foreground">
              {student?.college}
            </p>
          </ResumeSection>
        </section>
      </div>
    </div>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="eyebrow mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[0.84rem] leading-relaxed text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span>{children}</span>
    </li>
  );
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="text-[0.88rem] font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[0.76rem] text-muted-foreground">{detail}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
