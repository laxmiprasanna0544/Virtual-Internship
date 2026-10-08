"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Handshake,
  LogOut,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Logo } from "@/components/shared/logo";
import { DemoBadge } from "@/components/shared/demo-banner";
import { ThemeToggle } from "@/components/shared/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RouteGuard } from "@/components/dashboard/guard";
import { DOMAINS, getDomain } from "@/data/domains";
import { readinessForStudent } from "@/lib/career";
import { useDatabase } from "@/lib/db";
import { logout } from "@/lib/auth";

/**
 * Partner / employer talent view.
 *
 * Discovery is restricted to students who have *published* their Career
 * Passport — a partner cannot browse the student body, only the students who
 * chose to make their evidence public. That constraint is the whole design.
 */
export function PartnerView() {
  const router = useRouter();

  return (
    <RouteGuard allow={["partner", "admin"]}>
      {({ user }) => (
        <div className="min-h-screen bg-muted/25">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="container flex h-16 items-center gap-4">
              <Logo href="/partner" />
              <p className="ml-1 hidden items-center gap-2 text-sm font-semibold text-foreground sm:flex">
                <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
                Talent
              </p>
              <div className="ml-auto flex items-center gap-2">
                <DemoBadge />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            </div>
          </header>

          <main className="container py-8">
            <TalentDirectory partnerName={user.name} />
          </main>
        </div>
      )}
    </RouteGuard>
  );
}

function TalentDirectory({ partnerName }: { partnerName: string }) {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("all");
  const [minReadiness, setMinReadiness] = React.useState("0");

  if (!db) return <LoadingState label="Loading talent" rows={4} />;

  const published = db.passports.filter((p) => p.published);

  const candidates = published
    .map((passport) => {
      const student = db.students.find((s) => s.id === passport.studentId);
      if (!student) return null;
      const readiness = readinessForStudent(student.id);
      const projects = db.projectSubmissions.filter(
        (p) => p.studentId === student.id && p.status === "evaluated",
      );
      return { passport, student, readiness, projects };
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) => {
      if (domainFilter !== "all" && c.student.domainId !== domainFilter) {
        return false;
      }
      if (c.readiness.score < Number(minReadiness)) return false;
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return (
        c.student.name.toLowerCase().includes(needle) ||
        c.passport.headline.toLowerCase().includes(needle) ||
        (getDomain(c.student.domainId)?.name ?? "").toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.readiness.score - a.readiness.score);

  return (
    <div>
      <PageHeader
        title="Talent"
        description={`Students who have published their Career Passport. ${partnerName} sees evidence students chose to make public — assessed skills, evaluated projects and verified credentials.`}
      />

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, headline or domain"
            aria-label="Search talent"
          />
        </div>

        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="sm:w-[15rem]" aria-label="Filter by domain">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {DOMAINS.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minReadiness} onValueChange={setMinReadiness}>
          <SelectTrigger className="sm:w-[13rem]" aria-label="Minimum readiness">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any readiness</SelectItem>
            <SelectItem value="50">50+ readiness</SelectItem>
            <SelectItem value="70">70+ readiness</SelectItem>
            <SelectItem value="80">80+ readiness</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No published profiles match"
          description="Only students who publish their Career Passport appear here. Try widening the filters."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map(({ passport, student, readiness, projects }) => {
            const domain = getDomain(student.domainId);
            return (
              <div
                key={passport.studentId}
                className="lift-card flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-semibold text-foreground">
                      {student.name}
                    </p>
                    <p className="mt-0.5 truncate text-[0.78rem] text-muted-foreground">
                      {domain?.name ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant={readiness.score >= 75 ? "success" : "outline"}
                    className="shrink-0 font-mono"
                  >
                    {readiness.score}
                  </Badge>
                </div>

                <p className="mt-3 flex-1 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {passport.headline}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {readiness.strengths.slice(0, 3).map((strength) => (
                    <span
                      key={strength}
                      className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground"
                    >
                      {strength}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-[0.74rem] text-muted-foreground">
                  {projects.length} evaluated project
                  {projects.length === 1 ? "" : "s"} · {student.college}
                </p>

                <Button asChild variant="outline" size="sm" className="mt-5">
                  <Link href={`/profile/${passport.slug}`} target="_blank">
                    View Career Passport{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
          Only students who have published their Career Passport are listed.
          Readiness scores measure evidence produced on the Roystian platform
          and are not a prediction of job performance. Roystian Foundation makes
          no representation about a student&rsquo;s suitability for any role.
        </p>
      </div>
    </div>
  );
}
