"use client";

import * as React from "react";
import { Building2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { FilterBar } from "@/components/admin/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatabase } from "@/lib/db";
import { setLeadStatus } from "@/lib/leads";
import { formatDate } from "@/lib/utils";
import type { CollegeLead } from "@/types";

const STATUSES: CollegeLead["status"][] = ["new", "contacted", "scheduled", "closed"];

export function AdminLeads() {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.leads]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((lead) => {
        if (statusFilter !== "all" && lead.status !== statusFilter) return false;
        if (!q) return true;
        return (
          lead.collegeName.toLowerCase().includes(q) ||
          lead.contactPerson.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q)
        );
      });
  }, [db, query, statusFilter]);

  if (!db) return <LoadingState label="Loading college leads" rows={3} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="College Leads"
        description="Enquiries submitted through the college partnership form."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {STATUSES.map((status) => (
          <StatCard
            key={status}
            label={status}
            value={db.leads.filter((l) => l.status === status).length}
            icon={Building2}
          />
        ))}
      </div>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by college, contact or email"
        onReset={() => {
          setQuery("");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "lead-status",
            label: "Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUSES.map((status) => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1),
            })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No college leads"
          description="Enquiries submitted on the For Colleges page appear here."
          actionLabel="Open the colleges page"
          actionHref="/colleges"
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {lead.collegeName}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lead.contactPerson} · {lead.studentCount} students
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </div>

              <p className="mt-3 text-sm text-foreground">{lead.interest}</p>
              {lead.message && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {lead.message}
                </p>
              )}

              <dl className="mt-4 space-y-1.5 border-t border-border pt-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="break-all text-muted-foreground">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">{lead.phone}</span>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {formatDate(lead.createdAt)}
                </span>
                <div className="w-40">
                  <label htmlFor={`lead-${lead.id}`} className="sr-only">
                    Update status for {lead.collegeName}
                  </label>
                  <Select
                    value={lead.status}
                    onValueChange={(value) => {
                      setLeadStatus(lead.id, value as CollegeLead["status"]);
                      toast.success("Lead status updated");
                    }}
                  >
                    <SelectTrigger id={`lead-${lead.id}`} className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
