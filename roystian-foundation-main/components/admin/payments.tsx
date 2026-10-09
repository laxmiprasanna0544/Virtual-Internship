"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { refundPayment, useAdminData } from "@/lib/admin-data";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { Payment } from "@/types";

export function AdminPayments() {
  const db = useAdminData();
  const [query, setQuery] = React.useState("");
  const [methodFilter, setMethodFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.payments]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((payment) => {
        if (methodFilter !== "all" && payment.method !== methodFilter) return false;
        if (statusFilter !== "all" && payment.status !== statusFilter) return false;
        if (!q) return true;
        return (
          payment.id.toLowerCase().includes(q) ||
          payment.registrationId.toLowerCase().includes(q) ||
          payment.studentName.toLowerCase().includes(q) ||
          payment.reference.toLowerCase().includes(q)
        );
      });
  }, [db, query, methodFilter, statusFilter]);

  if (!db) return <LoadingState label="Loading payments" rows={4} />;

  const successful = db.payments.filter((p) => p.status === "successful");
  const refunded = db.payments.filter((p) => p.status === "refunded");

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "Payment ID",
      primary: true,
      render: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      key: "registration",
      header: "Registration ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.registrationId}
        </span>
      ),
    },
    {
      key: "student",
      header: "Student",
      render: (row) => <span className="text-foreground">{row.studentName}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => <span className="text-foreground">{formatINR(row.amount)}</span>,
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="uppercase text-muted-foreground">{row.method ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        row.status === "successful" ? (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" aria-label={`Refund ${row.id}`}>
                <RefreshCcw /> Refund
              </Button>
            }
            title="Mark this payment as refunded?"
            description={`${formatINR(row.amount)} for ${row.studentName} will be marked refunded and the registration payment status updated. This records the refund and removes access to the domain; the money must also be refunded in the payment gateway.`}
            confirmLabel="Mark refunded"
            destructive
            onConfirm={async () => {
              try {
                await refundPayment(row.id);
                toast.success("Payment marked as refunded", {
                  description: "Refund the money in the payment gateway as well.",
                });
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Refund failed.");
              }
            }}
          />
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Payment records for every registration."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total collected" value={formatINR(successful.reduce((s, p) => s + p.amount, 0))} />
        <StatCard label="Successful" value={successful.length} />
        <StatCard label="Refunded" value={refunded.length} />
        <StatCard
          label="Average ticket"
          value={
            successful.length
              ? formatINR(
                  Math.round(
                    successful.reduce((s, p) => s + p.amount, 0) / successful.length,
                  ),
                )
              : "—"
          }
        />
      </div>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by payment ID, registration ID, student or reference"
        onReset={() => {
          setQuery("");
          setMethodFilter("all");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "pay-method",
            label: "Methods",
            value: methodFilter,
            onChange: setMethodFilter,
            options: [
              { value: "upi", label: "UPI" },
              { value: "card", label: "Card" },
              { value: "netbanking", label: "Net Banking" },
            ],
          },
          {
            id: "pay-status",
            label: "Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "successful", label: "Successful" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(row) => row.id}
        emptyTitle="No payments match those filters"
        emptyDescription="Adjust the filters to see more results."
      />
    </div>
  );
}
