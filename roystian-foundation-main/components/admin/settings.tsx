"use client";

import * as React from "react";
import { Database, Download, Info, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ThemeToggle } from "@/components/shared/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAdminData } from "@/lib/admin-data";
import { resetDB } from "@/lib/db";
import { useSession } from "@/lib/auth";

export function AdminSettings() {
  const db = useAdminData();
  const { user } = useSession();

  if (!db) return <LoadingState label="Loading settings" rows={3} />;

  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roystian-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  }

  const counts = [
    { label: "Students", value: db.students.length },
    { label: "Registrations", value: db.registrations.length },
    { label: "Payments", value: db.payments.length },
    { label: "Certificates", value: db.certificates.length },
    { label: "Submissions", value: db.submissions.length },
    { label: "Communications", value: db.communications.length },
    { label: "College leads", value: db.leads.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform data, messaging and account information."
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">Records</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Live counts from the database.</p>

        <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">Messaging</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enrolment and certificate emails and WhatsApp messages are recorded in the
            communication log as <span className="font-medium text-foreground">queued</span>.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="theme-toggle">Appearance</Label>
            <ThemeToggle />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            No email or WhatsApp provider is connected yet, so queued messages are not
            delivered.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The export contains students' personal details. Store it securely.
          </p>
          <div className="mt-4 space-y-2.5">
            <Button variant="outline" className="w-full" onClick={exportData}>
              <Download /> Export records as JSON
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="w-full">
                  <RefreshCw /> Reset browser demo data
                </Button>
              }
              title="Reset browser demo data?"
              description="Restores the sample data that career tools, catalogue edits, projects and opportunities still read from this browser. Database records are not affected."
              confirmLabel="Reset browser data"
              destructive
              onConfirm={() => {
                resetDB();
                toast.success("Browser demo data reset");
              }}
            />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Students, enrolments, payments, submissions, certificates and leads are stored
            in Supabase.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">Accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">{user?.name}</span> (
          {user?.role}).
        </p>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Accounts are managed in Supabase Auth. Staff roles are granted by an
          administrator and cannot be self-assigned.
        </p>
      </section>
    </div>
  );
}
