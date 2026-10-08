"use client";

import * as React from "react";
import { Award, HeartHandshake, Loader2, Swords } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getChallenge } from "@/data/challenges";
import { FELLOWSHIP_STAGE_LABEL } from "@/data/opportunities";
import {
  decideScholarship,
  scoreChallengeEntry,
  setFellowshipStage,
} from "@/lib/opportunities";
import { useDatabase } from "@/lib/db";
import { delay } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { FellowshipStage, ScholarshipTier } from "@/types";

const STAGES: FellowshipStage[] = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "not-selected",
];

export function OpportunitiesAdmin() {
  const db = useDatabase();

  if (!db) return <LoadingState label="Loading opportunities" rows={4} />;

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Challenge entries, fellowship applications and scholarship decisions. Every score here flows straight into student readiness."
      />

      <Tabs defaultValue="challenges">
        <TabsList>
          <TabsTrigger value="challenges">
            Challenges ({db.challengeEntries.filter((c) => c.status === "submitted").length})
          </TabsTrigger>
          <TabsTrigger value="fellowship">
            Fellowship ({db.fellowshipApplications.length})
          </TabsTrigger>
          <TabsTrigger value="scholarship">
            Scholarship ({db.scholarshipApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <ChallengeQueue />
        </TabsContent>
        <TabsContent value="fellowship" className="mt-6">
          <FellowshipQueue />
        </TabsContent>
        <TabsContent value="scholarship" className="mt-6">
          <ScholarshipQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------------- Challenges --------------------------- */

function ChallengeQueue() {
  const db = useDatabase();
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  if (!db) return null;

  const entries = [...db.challengeEntries].sort((a, b) =>
    (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
  );

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="No challenge entries"
        description="Entries appear here as students submit them."
      />
    );
  }

  async function save(entryId: string) {
    const raw = Number(scores[entryId]);
    if (!Number.isFinite(raw)) {
      toast.error("Enter a score between 0 and 100.");
      return;
    }
    setBusy(entryId);
    await delay(350);
    scoreChallengeEntry(entryId, raw, notes[entryId] ?? "");
    setBusy(null);
    toast.success("Entry scored");
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const challenge = getChallenge(entry.challengeId);
        const student = db.students.find((s) => s.id === entry.studentId);

        return (
          <div
            key={entry.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.92rem] font-semibold text-foreground">
                  {challenge?.title ?? entry.challengeId}
                </p>
                <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                  {student?.name ?? "Unknown"} ·{" "}
                  {entry.submittedAt ? formatDate(entry.submittedAt) : "—"}
                </p>
              </div>
              {entry.status === "evaluated" ? (
                <Badge variant="success" className="font-mono">
                  {entry.score}%
                </Badge>
              ) : (
                <Badge variant="secondary">Awaiting score</Badge>
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div>
                <p className="eyebrow mb-1.5">Approach</p>
                <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-muted-foreground">
                  {entry.approach}
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Solution</p>
                <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-muted-foreground">
                  {entry.solution}
                </p>
              </div>
            </div>

            {challenge && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <p className="eyebrow mb-2">Judged on</p>
                <ul className="space-y-1">
                  {challenge.evaluationCriteria.map((criterion) => (
                    <li
                      key={criterion}
                      className="text-[0.78rem] leading-relaxed text-muted-foreground"
                    >
                      · {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
              <Input
                type="number"
                min={0}
                max={100}
                className="sm:w-28"
                placeholder="Score"
                value={scores[entry.id] ?? String(entry.score ?? "")}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [entry.id]: e.target.value }))
                }
                aria-label="Score"
              />
              <Textarea
                rows={2}
                className="flex-1"
                placeholder="Feedback"
                value={notes[entry.id] ?? entry.feedback ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))
                }
                aria-label="Feedback"
              />
              <Button
                onClick={() => save(entry.id)}
                disabled={busy === entry.id}
                className="shrink-0"
              >
                {busy === entry.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------- Fellowship --------------------------- */

function FellowshipQueue() {
  const db = useDatabase();
  if (!db) return null;

  const applications = [...db.fellowshipApplications].sort((a, b) =>
    (b.appliedAt ?? "").localeCompare(a.appliedAt ?? ""),
  );

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No fellowship applications"
        description="Applications appear here once eligible students apply."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => {
        const student = db.students.find((s) => s.id === application.studentId);
        return (
          <div
            key={application.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.92rem] font-semibold text-foreground">
                  {student?.name ?? "Unknown"}
                </p>
                <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                  {application.preferredArea} · available{" "}
                  {application.availableFrom} ·{" "}
                  {application.canRelocate ? "can relocate" : "cannot relocate"}
                </p>
                <p className="mt-1 text-[0.78rem] text-muted-foreground">
                  Readiness at application:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {application.readinessAtApply}
                  </span>
                </p>
              </div>

              <Select
                value={application.stage}
                onValueChange={(next) =>
                  setFellowshipStage(application.id, next as FellowshipStage)
                }
              >
                <SelectTrigger className="w-[13rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {FELLOWSHIP_STAGE_LABEL[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-[0.84rem] leading-relaxed text-muted-foreground">
              {application.motivation}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------- Scholarship --------------------------- */

function ScholarshipQueue() {
  const db = useDatabase();
  if (!db) return null;

  const applications = [...db.scholarshipApplications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No scholarship applications"
        description="Applications appear here as students submit them."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => {
        const student = db.students.find((s) => s.id === application.studentId);
        return (
          <div
            key={application.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.92rem] font-semibold text-foreground">
                  {student?.name ?? "Unknown"}
                </p>
                <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                  Requested {application.requestedTier}% ·{" "}
                  {application.householdIncomeBand} · {application.category}
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

            <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-[0.84rem] leading-relaxed text-muted-foreground">
              {application.statement}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {([100, 75, 50] as ScholarshipTier[]).map((tier) => (
                <Button
                  key={tier}
                  size="sm"
                  variant={application.awardedTier === tier ? "default" : "outline"}
                  onClick={() => {
                    decideScholarship(application.id, "approved", tier);
                    toast.success(`Awarded ${tier}% support`);
                  }}
                >
                  Award {tier}%
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  decideScholarship(application.id, "declined", null);
                  toast.success("Application declined");
                }}
              >
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
