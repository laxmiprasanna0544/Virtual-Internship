"use client";

import * as React from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filters";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/lib/db";
import { DOMAINS, getDomain } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { formatDate, formatINR } from "@/lib/utils";
import type { Registration } from "@/types";

export function AdminRegistrations() {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("all");
  const [programFilter, setProgramFilter] = React.useState("all");
  const [paymentFilter, setPaymentFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.registrations]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((registration) => {
        if (domainFilter !== "all" && registration.domainId !== domainFilter) return false;
        if (programFilter !== "all" && registration.programId !== programFilter) return false;
        if (paymentFilter !== "all" && registration.paymentStatus !== paymentFilter)
          return false;
        if (statusFilter !== "all" && registration.internshipStatus !== statusFilter)
          return false;
        if (!q) return true;
        return (
          registration.id.toLowerCase().includes(q) ||
          registration.studentName.toLowerCase().includes(q) ||
          registration.email.toLowerCase().includes(q)
        );
      });
  }, [db, query, domainFilter, programFilter, paymentFilter, statusFilter]);

  if (!db) return <LoadingState label="Loading registrations" rows={4} />;

  const columns: Column<Registration>[] = [
    {
      key: "id",
      header: "Registration ID",
      primary: true,
      render: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <Link
          href={`/admin/students/${row.studentId}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.studentName}
        </Link>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      render: (row) => (
        <span className="text-muted-foreground">
          {getDomain(row.domainId)?.shortName ?? "—"}
        </span>
      ),
    },
    {
      key: "program",
      header: "Program",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.programId === "industry-led" ? "Industry-Led" : "Self-Paced"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => <span className="text-foreground">{formatINR(row.amount)}</span>,
    },
    {
      key: "payment",
      header: "Payment Status",
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: "internship",
      header: "Internship Status",
      render: (row) => <StatusBadge status={row.internshipStatus} />,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Button asChild variant="ghost" size="icon" aria-label={`Open ${row.studentName}`}>
          <Link href={`/admin/students/${row.studentId}`}>
            <Eye />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registrations"
        description="Every internship registration with its payment and completion state."
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by registration ID, student or email"
        onReset={() => {
          setQuery("");
          setDomainFilter("all");
          setProgramFilter("all");
          setPaymentFilter("all");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "reg-domain",
            label: "Domains",
            value: domainFilter,
            onChange: setDomainFilter,
            options: DOMAINS.map((d) => ({ value: d.id, label: d.shortName })),
          },
          {
            id: "reg-program",
            label: "Programs",
            value: programFilter,
            onChange: setProgramFilter,
            options: PROGRAMS.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            id: "reg-payment",
            label: "Payment",
            value: paymentFilter,
            onChange: setPaymentFilter,
            options: [
              { value: "successful", label: "Successful" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ],
          },
          {
            id: "reg-status",
            label: "Completion",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "not-started", label: "Not started" },
              { value: "in-progress", label: "In progress" },
              { value: "completed", label: "Completed" },
              { value: "certified", label: "Certified" },
            ],
          },
        ]}
      />

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {db.registrations.length} registrations
      </p>

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(row) => row.id}
        emptyTitle="No registrations match those filters"
        emptyDescription="Adjust the filters to see more results."
      />
    </div>
  );
}
