"use client";

import { BadgeCheck, Lock, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { cn, formatDate } from "@/lib/utils";

export function BadgesView() {
  const { ready } = useStudentContext();
  const career = useCareerContext();

  if (!ready || !career.ready) {
    return <LoadingState label="Checking your badges" rows={3} />;
  }

  const earned = career.badges.filter((b) => b.earned);
  const locked = career.badges.filter((b) => !b.earned);

  return (
    <div>
      <PageHeader
        title="Skill Badges"
        description="Earned from demonstrated performance, never awarded automatically. Each badge below shows exactly what unlocked it — or exactly what would."
        action={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-soft">
            <Trophy className="h-4 w-4 text-warning-ink" aria-hidden="true" />
            <span className="font-mono text-sm font-semibold text-foreground">
              {earned.length} / {career.badges.length}
            </span>
          </div>
        }
      />

      {earned.length > 0 && (
        <section>
          <h2 className="eyebrow mb-4">Earned</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((badge) => (
              <div
                key={badge.id}
                className="lift-card rounded-2xl border border-success/30 bg-success/[0.05] p-6 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/12 text-success">
                    <DynamicIcon name={badge.icon} className="h-5 w-5" />
                  </span>
                  <Badge variant="success">Earned</Badge>
                </div>

                <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                  {badge.displayName}
                </h3>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {badge.description}
                </p>

                <div className="mt-4 border-t border-success/20 pt-3.5">
                  <p className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-foreground">
                    <BadgeCheck
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    {badge.evidence}
                  </p>
                  {badge.earnedAt && (
                    <p className="mt-2 text-[0.72rem] text-muted-foreground">
                      {formatDate(badge.earnedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className={cn(earned.length > 0 && "mt-10")}>
          <h2 className="eyebrow mb-4">Still to earn</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <DynamicIcon name={badge.icon} className="h-5 w-5" />
                  </span>
                  <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-[0.95rem] font-semibold text-foreground">
                  {badge.displayName}
                </h3>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {badge.description}
                </p>

                <div className="mt-4 border-t border-border pt-3.5">
                  <p className="eyebrow mb-1.5 text-[0.62rem]">How to earn it</p>
                  <p className="text-[0.78rem] leading-relaxed text-foreground">
                    {badge.criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-[0.78rem] leading-relaxed text-muted-foreground">
        Badges appear on your Career Passport when you choose to show them.
        Because they are tied to real performance data, a badge can only exist
        where the underlying work does.
      </p>
    </div>
  );
}
