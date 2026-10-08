"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/lib/db";
import { setCertificateStatus } from "@/lib/certificates";
import { DOMAINS, getDomain } from "@/data/domains";
import { formatDate } from "@/lib/utils";
import type { Certificate } from "@/types";

export function AdminCertificates() {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.certificates]
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
      .filter((certificate) => {
        if (domainFilter !== "all" && certificate.domainId !== domainFilter) return false;
        if (statusFilter !== "all" && certificate.status !== statusFilter) return false;
        if (!q) return true;
        return (
          certificate.id.toLowerCase().includes(q) ||
          certificate.studentName.toLowerCase().includes(q)
        );
      });
  }, [db, query, domainFilter, statusFilter]);

  if (!db) return <LoadingState label="Loading certificates" rows={4} />;

  const columns: Column<Certificate>[] = [
    {
      key: "id",
      header: "Certificate ID",
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
          {getDomain(row.domainId)?.shortName ?? row.domainName}
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
      key: "issued",
      header: "Issue date",
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.issueDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/verify/${row.id}`}>
              <ShieldCheck /> Verify
            </Link>
          </Button>
          {row.status === "valid" ? (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <ShieldX /> Revoke
                </Button>
              }
              title={`Revoke certificate ${row.id}?`}
              description="The public verification page will immediately report this certificate as revoked. This can be undone."
              confirmLabel="Revoke certificate"
              destructive
              onConfirm={() => {
                setCertificateStatus(row.id, "revoked");
                toast.success("Certificate revoked");
              }}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCertificateStatus(row.id, "valid");
                toast.success("Certificate restored");
              }}
            >
              <RotateCcw /> Restore
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Certificates"
        description="Issued certificates and their public verification status."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Issued" value={db.certificates.length} />
        <StatCard
          label="Valid"
          value={db.certificates.filter((c) => c.status === "valid").length}
        />
        <StatCard
          label="Revoked"
          value={db.certificates.filter((c) => c.status === "revoked").length}
        />
      </div>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by certificate ID or student"
        onReset={() => {
          setQuery("");
          setDomainFilter("all");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "cert-domain",
            label: "Domains",
            value: domainFilter,
            onChange: setDomainFilter,
            options: DOMAINS.map((d) => ({ value: d.id, label: d.shortName })),
          },
          {
            id: "cert-status",
            label: "Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "valid", label: "Valid" },
              { value: "revoked", label: "Revoked" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(row) => row.id}
        emptyTitle="No certificates match those filters"
        emptyDescription="Certificates appear here once students complete their requirements."
      />
    </div>
  );
}
