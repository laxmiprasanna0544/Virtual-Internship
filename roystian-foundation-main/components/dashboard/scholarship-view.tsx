"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Info, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INCOME_BANDS,
  SCHOLARSHIP_CATEGORIES,
  SCHOLARSHIP_TIERS,
} from "@/data/opportunities";
import { applyForScholarship, scholarshipFor } from "@/lib/opportunities";
import { useStudentContext } from "@/lib/use-student";
import { delay } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { ScholarshipApplication, ScholarshipTier } from "@/types";

export function ScholarshipView() {
  const { ready, student } = useStudentContext();

  const [application, setApplication] =
    React.useState<ScholarshipApplication | null>(null);
  const [tier, setTier] = React.useState<ScholarshipTier | null>(null);
  const [income, setIncome] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [statement, setStatement] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (hydrated || !student) return;
    const stored = scholarshipFor(student.id);
    if (stored) setApplication(stored);
    setHydrated(true);
  }, [student, hydrated]);

  if (!ready) return <LoadingState label="Loading scholarship" rows={3} />;

  async function handleApply() {
    if (!student) return;
    if (!tier || !income || !category) {
      toast.error("Missing details", {
        description: "Select a tier, an income band and a category.",
      });
      return;
    }
    if (statement.trim().length < 200) {
      toast.error("Your statement is too short", {
        description: "At least 200 characters on why this matters to you.",
      });
      return;
    }

    setBusy(true);
    await delay(600);
    const created = applyForScholarship(student.id, {
      requestedTier: tier,
      householdIncomeBand: income,
      category,
      statement,
    });
    setApplication(created);
    setBusy(false);
    toast.success("Application submitted", {
      description: "Places are limited and an award is not guaranteed.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Roystian Skill Scholarship"
        description="Talent should not be limited by a student's ability to pay. Support is offered at three levels against published eligibility criteria."
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/opportunities/scholarship">
              About the scholarship <ArrowRight className="cta-arrow" />
            </Link>
          </Button>
        }
      />

      {application ? (
        <div className="max-w-2xl">
          <section className="rounded-2xl border border-border bg-card p-7 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[0.95rem] font-semibold text-foreground">
                  Your application
                </h2>
                <p className="mt-1 text-[0.8rem] text-muted-foreground">
                  Submitted {formatDate(application.createdAt)}
                </p>
              </div>
              <Badge
                variant={
                  application.status === "approved"
                    ? "success"
                    : application.status === "declined"
                      ? "destructive"
                      : "secondary"
                }
                className="capitalize"
              >
                {application.status.replace("-", " ")}
              </Badge>
            </div>

            <dl className="mt-6 space-y-3 text-[0.88rem]">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-medium text-foreground">
                  {application.requestedTier}% support
                </dd>
              </div>
              {application.awardedTier != null && (
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Awarded</dt>
                  <dd className="font-semibold text-success">
                    {application.awardedTier}% support
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Income band</dt>
                <dd className="text-right font-medium text-foreground">
                  {application.householdIncomeBand}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium text-foreground">
                  {application.category}
                </dd>
              </div>
            </dl>

            <p className="mt-6 border-t border-border pt-4 text-[0.78rem] leading-relaxed text-muted-foreground">
              Your application is under review. Places in each cycle are limited
              and an award is not guaranteed.
            </p>
          </section>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* ── Tier selection ───────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Choose a support level
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {SCHOLARSHIP_TIERS.map((option) => (
                <button
                  key={option.tier}
                  type="button"
                  onClick={() => setTier(option.tier)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    tier === option.tier
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <p className="font-display text-lg font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">
                    {option.blurb}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-[0.74rem] leading-relaxed text-muted-foreground">
                Apply for what you genuinely need. The review considers
                financial need alongside your stated intent.
              </p>
            </div>
          </section>

          {/* ── Details ──────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              Your details
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="income">Annual household income</Label>
                <Select value={income} onValueChange={setIncome}>
                  <SelectTrigger id="income" className="mt-2">
                    <SelectValue placeholder="Select a band" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOLARSHIP_CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statement">Your statement</Label>
                <Textarea
                  id="statement"
                  rows={7}
                  className="mt-2"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Why this programme matters to you, and what you intend to do with it."
                />
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  {statement.trim().length} characters · 200 minimum
                </p>
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

              <p className="text-[0.74rem] leading-relaxed text-muted-foreground">
                The scholarship is operated by Roystian Foundation, a Section 8
                non-profit. Applying does not guarantee an award.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
