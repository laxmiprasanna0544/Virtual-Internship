"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { DemoNote } from "@/components/shared/demo-banner";
import { DynamicIcon } from "@/components/shared/icon";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/lib/db";
import { catalogTrainers } from "@/lib/catalog";
import { DOMAINS, getDomain } from "@/data/domains";
import { buildSchedule } from "@/lib/schedule";
import { formatDate, initials as toInitials } from "@/lib/utils";

export function AdminTrainerProfile({ trainerId }: { trainerId: string }) {
  const db = useDatabase();

  if (!db) return <LoadingState label="Loading trainer" rows={3} />;

  const trainer = catalogTrainers(db).find((t) => t.id === trainerId);
  if (!trainer) {
    return (
      <EmptyState
        icon={Users}
        title="Trainer not found"
        description="This trainer profile does not exist in the demo catalogue."
        actionLabel="Back to trainers"
        actionHref="/admin/trainers"
      />
    );
  }

  const assignedDomains = DOMAINS.filter((d) => trainer.domains.includes(d.id));

  // Industry-led registrations in this trainer's domains are the cohort they lead.
  const cohort = db.registrations.filter(
    (r) => r.programId === "industry-led" && trainer.domains.includes(r.domainId),
  );
  const certified = cohort.filter((r) => r.internshipStatus === "certified").length;

  const upcoming = assignedDomains
    .flatMap((domain) => {
      const registration = cohort.find((r) => r.domainId === domain.id);
      if (!registration) return [];
      return buildSchedule(domain.id, registration.startDate)
        .filter((item) => item.status !== "completed")
        .slice(0, 2)
        .map((item) => ({ ...item, domainName: domain.shortName }));
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={trainer.name}
        description={`${trainer.role} · ${trainer.industry}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Trainers", href: "/admin/trainers" },
          { label: trainer.name },
        ]}
        action={
          <Button asChild variant="outline">
            <a href={trainer.linkedin} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> LinkedIn
            </a>
          </Button>
        }
      />

      <DemoNote>
        This is an illustrative persona created for the demonstration environment. It
        is not a real individual and carries no real credentials.
      </DemoNote>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/8 font-display text-lg font-semibold text-primary">
            {trainer.initials || toInitials(trainer.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {trainer.name}
              </h2>
              <Badge variant={trainer.active ? "success" : "secondary"}>
                {trainer.active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="warning">Demo profile</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {trainer.bio}
            </p>

            <dl className="mt-5 grid gap-x-8 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Role", value: trainer.role },
                { label: "Industry", value: trainer.industry },
                { label: "Experience", value: trainer.experience },
                { label: "Specialization", value: trainer.specialization },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Assigned domains"
          value={assignedDomains.length}
          icon={Briefcase}
        />
        <StatCard
          label="Industry-led cohort"
          value={cohort.length}
          hint="registrations"
          icon={Users}
        />
        <StatCard
          label="Certified"
          value={certified}
          hint="from this cohort"
          icon={GraduationCap}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Assigned domains
          </h2>
          {assignedDomains.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No domains are assigned to this trainer yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {assignedDomains.map((domain) => (
                <li key={domain.id}>
                  <Link
                    href={`/internships/${domain.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 transition-colors hover:border-primary/35"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                      <DynamicIcon name={domain.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {domain.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {domain.modules.length} modules · {domain.category}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Upcoming sessions
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No upcoming live sessions in this trainer's domains.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {upcoming.map((item) => (
                <li
                  key={`${item.domainName}-${item.id}`}
                  className="rounded-xl border border-border px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        Day {String(item.day).padStart(2, "0")} — {item.topic}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.domainName} · {formatDate(item.date)} · {item.time}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Cohort students
        </h2>
        {cohort.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No industry-led students are enrolled in this trainer's domains yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {cohort.slice(0, 8).map((registration) => (
              <li
                key={registration.id}
                className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/admin/students/${registration.studentId}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {registration.studentName}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {getDomain(registration.domainId)?.shortName}
                  </span>
                  <StatusBadge status={registration.internshipStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
