"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, Eye, PlayCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDatabase, updateDB } from "@/lib/db";
import { studentProgressPercent } from "@/lib/analytics";
import { DOMAINS, getDomain } from "@/data/domains";
import { PROGRAMS } from "@/data/programs";
import { formatDate } from "@/lib/utils";
import type { Student } from "@/types";

export function AdminStudents() {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("all");
  const [programFilter, setProgramFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return db.students.filter((student) => {
      if (domainFilter !== "all" && student.domainId !== domainFilter) return false;
      if (programFilter !== "all" && student.programId !== programFilter) return false;
      if (statusFilter !== "all" && student.status !== statusFilter) return false;
      if (!q) return true;
      return (
        student.name.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q) ||
        student.college.toLowerCase().includes(q) ||
        (student.registrationId ?? "").toLowerCase().includes(q)
      );
    });
  }, [db, query, domainFilter, programFilter, statusFilter]);

  if (!db) return <LoadingState label="Loading students" rows={4} />;

  function toggleSuspend(student: Student) {
    const next = student.status === "suspended" ? "active" : "suspended";
    updateDB((draft) => {
      draft.students = draft.students.map((s) =>
        s.id === student.id ? { ...s, status: next } : s,
      );
    });
    toast.success(
      next === "suspended"
        ? `${student.name} suspended`
        : `${student.name} reactivated`,
    );
  }

  const columns: Column<Student>[] = [
    {
      key: "student",
      header: "Student",
      primary: true,
      render: (student) => (
        <div className="min-w-0">
          <Link
            href={`/admin/students/${student.id}`}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {student.name}
          </Link>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {student.email}
          </span>
        </div>
      ),
    },
    {
      key: "college",
      header: "College",
      render: (student) => (
        <span className="text-muted-foreground">{student.college || "—"}</span>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      render: (student) => (
        <span className="text-muted-foreground">
          {getDomain(student.domainId)?.shortName ?? "—"}
        </span>
      ),
    },
    {
      key: "program",
      header: "Program",
      render: (student) => (
        <span className="text-muted-foreground">
          {student.programId === "industry-led"
            ? "Industry-Led"
            : student.programId === "self-paced"
              ? "Self-Paced"
              : "—"}
        </span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (student) => {
        const percent = db ? studentProgressPercent(db, student.id) : 0;
        return (
          <div className="flex min-w-[7rem] items-center gap-2">
            <Progress value={percent} className="h-1.5 w-16" />
            <span className="text-xs text-muted-foreground">{percent}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (student) => <StatusBadge status={student.status} />,
    },
    {
      key: "date",
      header: "Registration Date",
      render: (student) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(student.enrolledAt ?? student.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (student) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon" aria-label={`View ${student.name}`}>
            <Link href={`/admin/students/${student.id}`}>
              <Eye />
            </Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  student.status === "suspended"
                    ? `Reactivate ${student.name}`
                    : `Suspend ${student.name}`
                }
              >
                {student.status === "suspended" ? <PlayCircle /> : <Ban />}
              </Button>
            }
            title={
              student.status === "suspended"
                ? `Reactivate ${student.name}?`
                : `Suspend ${student.name}?`
            }
            description={
              student.status === "suspended"
                ? "The student will be able to sign in and continue their internship."
                : "The student will not be able to sign in until the account is reactivated."
            }
            confirmLabel={student.status === "suspended" ? "Reactivate" : "Suspend"}
            destructive={student.status !== "suspended"}
            onConfirm={() => toggleSuspend(student)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description={`${db.students.length} students enrolled across ${DOMAINS.length} domains.`}
      />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by name, email, college or registration ID"
        onReset={() => {
          setQuery("");
          setDomainFilter("all");
          setProgramFilter("all");
          setStatusFilter("all");
        }}
        filters={[
          {
            id: "student-domain",
            label: "Domains",
            value: domainFilter,
            onChange: setDomainFilter,
            options: DOMAINS.map((d) => ({ value: d.id, label: d.shortName })),
          },
          {
            id: "student-program",
            label: "Programs",
            value: programFilter,
            onChange: setProgramFilter,
            options: PROGRAMS.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            id: "student-status",
            label: "Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
      />

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {db.students.length} students
      </p>

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(student) => student.id}
        emptyTitle="No students match those filters"
        emptyDescription="Try clearing the search or selecting a different domain."
      />

      {rows.length === 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setQuery("")}>
            <Users /> Show all students
          </Button>
        </div>
      )}
    </div>
  );
}
