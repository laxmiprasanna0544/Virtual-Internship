"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getDomain } from "@/data/domains";
import { readinessForStudent } from "@/lib/career";
import { useCampusContext } from "@/lib/campus";
import { useSession } from "@/lib/auth";
import { useDatabase } from "@/lib/db";
import { summariseProgress } from "@/lib/progress";

export function CampusStudents() {
  const { user } = useSession();
  const campus = useCampusContext(user?.id ?? null);
  const db = useDatabase();
  const [query, setQuery] = React.useState("");

  if (!campus.ready || !db) {
    return <LoadingState label="Loading students" rows={4} />;
  }

  if (campus.cohort.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students yet"
        description="Students from your institution appear here once they register."
        actionLabel="Back to overview"
        actionHref="/campus"
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const rows = campus.cohort
    .map((student) => {
      const progress =
        db.progress.find(
          (p) => p.studentId === student.id && p.domainId === student.domainId,
        ) ?? null;
      const submission =
        db.submissions.find((s) => s.studentId === student.id) ?? null;
      return {
        student,
        domain: getDomain(student.domainId),
        summary: summariseProgress(student, progress, submission),
        readiness: readinessForStudent(student.id).score,
      };
    })
    .filter((row) =>
      needle
        ? row.student.name.toLowerCase().includes(needle) ||
          row.student.email.toLowerCase().includes(needle) ||
          (row.domain?.name ?? "").toLowerCase().includes(needle)
        : true,
    )
    .sort((a, b) => b.readiness - a.readiness);

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${campus.cohort.length} students from ${campus.college?.name ?? "your institution"}, ranked by career readiness.`}
      />

      <div className="relative mb-5 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or domain"
          aria-label="Search students"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full min-w-[46rem]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Student", "Domain", "Progress", "Assessments", "Readiness"].map(
                (heading, index) => (
                  <th
                    key={heading}
                    className={
                      index > 1
                        ? "px-5 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground"
                        : "px-5 py-3 text-left text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground"
                    }
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.student.id}>
                <td className="px-5 py-3.5">
                  <p className="text-[0.88rem] font-medium text-foreground">
                    {row.student.name}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                    {row.student.course}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-[0.85rem] text-muted-foreground">
                  {row.domain?.name ?? "—"}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[0.85rem] text-muted-foreground">
                  {row.summary.overallPercent}%
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-[0.85rem] text-muted-foreground">
                  {row.summary.assessmentsPassed}/{row.summary.assessmentTotal}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Badge
                    variant={
                      row.readiness >= 75
                        ? "success"
                        : row.readiness >= 50
                          ? "default"
                          : "outline"
                    }
                    className="font-mono"
                  >
                    {row.readiness}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-5 text-sm text-muted-foreground">
          No students match &ldquo;{query}&rdquo;.
        </p>
      )}

      <p className="mt-6 text-[0.76rem] leading-relaxed text-muted-foreground">
        Readiness is computed from each student&rsquo;s assessments, projects
        and mock interviews. It measures evidence produced on the platform and
        is not a prediction of employability.
      </p>
    </div>
  );
}
