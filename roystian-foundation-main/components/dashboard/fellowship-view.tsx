"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Medal,
  Scale,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FELLOWSHIP_AREAS,
  FELLOWSHIP_STAGE_LABEL,
} from "@/data/opportunities";
import { applyForFellowship, fellowshipEligibility, fellowshipFor } from "@/lib/opportunities";
import { useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { delay } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { FellowshipApplication } from "@/types";

export function FellowshipView() {
  const { ready, student, certificate, summary } = useStudentContext();
  const career = useCareerContext();

  const [application, setApplication] =
    React.useState<FellowshipApplication | null>(null);
  const [motivation, setMotivation] = React.useState("");
  const [availableFrom, setAvailableFrom] = React.useState("");
  const [canRelocate, setCanRelocate] = React.useState(false);
  const [preferredArea, setPreferredArea] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (hydrated || !student) return;
    const stored = fellowshipFor(student.id);
    if (stored) {
      setApplication(stored);
      setMotivation(stored.motivation);
      setAvailableFrom(stored.availableFrom);
      setCanRelocate(stored.canRelocate);
      setPreferredArea(stored.preferredArea);
    }
    setHydrated(true);
  }, [student, hydrated]);

  if (!ready || !career.ready) {
    return <LoadingState label="Checking your eligibility" rows={3} />;
  }

  const eligibility = fellowshipEligibility({
    student,
    certificateIssued: Boolean(certificate),
    assessmentsPassed: summary.assessmentsPassed,
    assessmentTotal: summary.assessmentTotal,
    submission: null,
    projects: career.projects,
    challenges: career.challenges,
    readiness: career.readiness,
  });

  async function handleApply() {
    if (!student) return;
    if (motivation.trim().length < 150) {
      toast.error("Tell us more", {
        description: "At least 150 characters on why you want this.",
      });
      return;
    }
    if (!availableFrom || !preferredArea) {
      toast.error("Missing details", {
        description: "Set your availability and a preferred area.",
      });
      return;
    }

    setBusy(true);
    await delay(600);
    const created = applyForFellowship(student.id, career.readiness.score, {
      motivation,
      availableFrom,
      canRelocate,
      preferredArea,
    });
    setApplication(created);
    setBusy(false);
    toast.success("Application submitted", {
      description: "Selection is not guaranteed. You will be contacted if shortlisted.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Roystian Talent Fellowship"
        description="An advanced pathway for high-performing students — a 3-month paid offline internship in Hyderabad, with mentorship and a professional portfolio."
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/opportunities/fellowship">
              About the fellowship <ArrowRight className="cta-arrow" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ── Eligibility ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Your eligibility
              </h2>
              <p className="mt-1 text-[0.8rem] text-muted-foreground">
                {eligibility.metCount} of {eligibility.criteria.length}{" "}
                requirements met
              </p>
            </div>
            <Badge variant={eligibility.eligible ? "success" : "outline"}>
              {eligibility.eligible ? "Eligible to apply" : "Not yet eligible"}
            </Badge>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{
                width: `${(eligibility.metCount / eligibility.criteria.length) * 100}%`,
              }}
            />
          </div>

          <ul className="mt-6 divide-y divide-border">
            {eligibility.criteria.map((criterion) => (
              <li
                key={criterion.key}
                className="flex items-start gap-3.5 py-3.5 first:pt-0"
              >
                <span
                  className={
                    criterion.met
                      ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success"
                      : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  {criterion.met ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <X className="h-3 w-3" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.88rem] font-medium text-foreground">
                    {criterion.label}
                  </p>
                  <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted-foreground">
                    {criterion.detail}
                  </p>
                </div>
                {!criterion.met && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={criterion.href}>Go</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Application ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2.5">
            <Medal className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              {application ? "Your application" : "Apply"}
            </h2>
          </div>

          {application ? (
            <div className="mt-5">
              <div className="rounded-xl border border-border bg-muted/30 p-5">
                <p className="eyebrow mb-2">Current stage</p>
                <p className="font-display text-xl font-semibold text-foreground">
                  {FELLOWSHIP_STAGE_LABEL[application.stage]}
                </p>
                {application.appliedAt && (
                  <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                    Applied {formatDate(application.appliedAt)} with a readiness
                    score of {application.readinessAtApply}.
                  </p>
                )}
              </div>

              <dl className="mt-5 space-y-3 text-[0.85rem]">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Preferred area</dt>
                  <dd className="text-right font-medium text-foreground">
                    {application.preferredArea}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Available from</dt>
                  <dd className="text-right font-medium text-foreground">
                    {application.availableFrom}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Can relocate</dt>
                  <dd className="text-right font-medium text-foreground">
                    {application.canRelocate ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-border pt-4 text-[0.76rem] leading-relaxed text-muted-foreground">
                Your application is recorded. Shortlisting depends on
                assessments, project performance, interview, availability and
                eligibility — and is never guaranteed.
              </p>
            </div>
          ) : !eligibility.eligible ? (
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-5">
              <p className="flex items-center gap-2 text-[0.88rem] font-medium text-foreground">
                <Lock className="h-4 w-4" aria-hidden="true" />
                Application not open yet
              </p>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
                Meet all {eligibility.criteria.length} requirements to unlock the
                application. The list on the left shows exactly what is
                outstanding.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="motivation">Why this, and why you?</Label>
                <Textarea
                  id="motivation"
                  rows={6}
                  className="mt-2"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="What you want from the three months, and what you would bring to it."
                />
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  {motivation.trim().length} characters · 150 minimum
                </p>
              </div>

              <div>
                <Label htmlFor="area">Preferred area</Label>
                <Select value={preferredArea} onValueChange={setPreferredArea}>
                  <SelectTrigger id="area" className="mt-2">
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {FELLOWSHIP_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="available">Available from</Label>
                <Input
                  id="available"
                  type="date"
                  className="mt-2"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div>
                  <p className="text-[0.88rem] font-medium text-foreground">
                    Can relocate to Hyderabad
                  </p>
                  <p className="mt-0.5 text-[0.76rem] text-muted-foreground">
                    The internship is offline.
                  </p>
                </div>
                <Switch
                  checked={canRelocate}
                  onCheckedChange={setCanRelocate}
                  aria-label="Can relocate to Hyderabad"
                />
              </div>

              <Button className="w-full" onClick={handleApply} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send /> Submit application
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
        <Scale
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          Selection is based on applicable assessments, project performance,
          interview, availability and eligibility. Meeting every requirement
          makes you eligible to apply — it does not guarantee shortlisting or
          selection, and Roystian Foundation promises no placement at any stage.
        </p>
      </div>
    </div>
  );
}
