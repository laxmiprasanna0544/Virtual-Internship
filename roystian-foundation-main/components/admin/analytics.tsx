"use client";

import * as React from "react";
import { Award, CreditCard, GraduationCap, Layers, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { InfoNote } from "@/components/admin/info-note";
import {
  CompletionBarChart,
  DomainBarChart,
  RegistrationsChart,
  RevenueChart,
  SplitDonut,
} from "@/components/admin/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminData } from "@/lib/admin-data";
import {
  completionSplit,
  computeKpis,
  domainBreakdown,
  programSplit,
  registrationsOverTime,
} from "@/lib/analytics";
import { formatINR } from "@/lib/utils";

export function AdminAnalytics() {
  const db = useAdminData();

  if (!db) return <LoadingState label="Loading analytics" rows={4} />;

  const kpis = computeKpis(db);
  const timeline = registrationsOverTime(db, 10);
  const domains = domainBreakdown(db);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Registrations, revenue, domain distribution and completion, computed from live records."
      />

      <InfoNote>
        All values are computed from the records in the platform database at the time the
        page loaded.
      </InfoNote>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total registrations" value={db.registrations.length} icon={Users} />
        <StatCard label="Self-paced" value={kpis.selfPacedCount} icon={Layers} />
        <StatCard label="Industry-led" value={kpis.industryLedCount} icon={Layers} />
        <StatCard label="Revenue" value={formatINR(kpis.revenue)} icon={CreditCard} />
        <StatCard
          label="Completion rate"
          value={`${kpis.completionRate}%`}
          icon={GraduationCap}
        />
        <StatCard label="Certificates issued" value={kpis.certificatesIssued} icon={Award} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RegistrationsChart
          data={timeline}
          description="Weekly registrations over the last ten weeks"
        />
        <RevenueChart
          data={timeline}
          description="Weekly collected fees over the last ten weeks"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DomainBarChart
          data={domains}
          dataKey="revenue"
          money
          title="Revenue by domain"
          description="Collected programme fees per domain"
        />
        <div className="grid gap-4">
          <SplitDonut
            data={programSplit(db)}
            title="Program split"
            description="Registrations by programme type"
          />
          <CompletionBarChart data={completionSplit(db)} />
        </div>
      </div>

      <DomainBarChart
        data={domains}
        title="Domain distribution"
        description="Registrations per domain"
      />

      {/* Table */}
      <section className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Domain performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Registrations, revenue and certificates issued per domain
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead className="text-right">Registrations</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Certificates</TableHead>
              <TableHead className="text-right">Certification rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.domain}>
                <TableCell className="font-medium text-foreground">
                  {domain.domain}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {domain.registrations}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatINR(domain.revenue)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {domain.certificates}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {domain.registrations
                    ? Math.round((domain.certificates / domain.registrations) * 100)
                    : 0}
                  %
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
