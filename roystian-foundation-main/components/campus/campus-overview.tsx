"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { useCampusContext } from "@/lib/campus";
import { useSession } from "@/lib/auth";

/**
 * A placement officer's profile links to their college record (collegeId), so
 * the session resolves directly to their institution.
 */
export function CampusOverview() {
  const { user } = useSession();
  const campus = useCampusContext(user?.collegeId ?? user?.id ?? null);

  if (!campus.ready) return <LoadingState label="Loading your cohort" rows={3} />;

  if (!campus.college) {
    return (
      <EmptyState
        icon={Users}
        title="No institution linked"
        description="This account is not linked to a college record. Contact the programme team."
        actionLabel="Back to site"
        actionHref="/"
      />
    );
  }

  const { metrics, college, byDomain } = campus;

  if (metrics.enrolled === 0) {
    return (
      <div>
        <PageHeader
          title={college.name}
          description={`${college.city}, ${college.state}`}
        />
        <EmptyState
          icon={Users}
          title="No students enrolled yet"
          description="Figures appear here as soon as students from your institution register. We do not display sample numbers."
          actionLabel="See partnership options"
          actionHref="/colleges"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={college.name}
        description={`${college.city}, ${college.state} · ${college.departments.join(", ")}`}
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/campus/skill-gap">
              Skill gap report <ArrowRight className="cta-arrow" />
            </Link>
          </Button>
        }
      />

      {/* ── Headline metrics ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Students Enrolled"
          value={String(metrics.enrolled)}
          hint="from your institution"
          icon={Users}
        />
        <StatCard
          label="Active"
          value={String(metrics.active)}
          hint="currently progressing"
          icon={TrendingUp}
          delay={0.06}
        />
        <StatCard
          label="Completed"
          value={String(metrics.completed)}
          hint="requirements met"
          icon={CheckCircle2}
          delay={0.12}
        />
        <StatCard
          label="Projects"
          value={String(metrics.projects)}
          hint="started or submitted"
          icon={FolderKanban}
          delay={0.18}
        />
        <StatCard
          label="Avg Assessment"
          value={`${metrics.avgAssessment}%`}
          hint="cohort mean"
          icon={BarChart3}
          delay={0.24}
        />
        <StatCard
          label="Career Ready"
          value={String(metrics.careerReady)}
          hint="readiness of 75 or above"
          icon={GraduationCap}
          delay={0.3}
        />
      </div>

      {/* ── By department / domain ───────────────────────────────────── */}
      {byDomain.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow mb-4">By domain</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Domain
                  </th>
                  <th className="px-5 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Students
                  </th>
                  <th className="px-5 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Avg readiness
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byDomain.map((row) => (
                  <tr key={row.domainId}>
                    <td className="px-5 py-3.5 text-[0.88rem] font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[0.85rem] text-muted-foreground">
                      {row.count}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${row.avgReadiness}%` }}
                          />
                        </div>
                        <span className="font-mono text-[0.85rem] font-semibold text-foreground">
                          {row.avgReadiness}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mt-6 text-[0.76rem] leading-relaxed text-muted-foreground">
        Every figure on this page is computed live from your students&rsquo;
        actual platform activity. Career readiness is derived from assessments,
        projects and interviews — it is not a guarantee of employment.
      </p>
    </div>
  );
}
