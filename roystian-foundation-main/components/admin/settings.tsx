"use client";

import * as React from "react";
import { Database, Download, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { ThemeToggle } from "@/components/shared/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAdminData } from "@/lib/admin-data";
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
            Enrolment and certificate emails are sent through Resend and recorded in the
            communication log as <span className="font-medium text-foreground">sent</span> or{" "}
            <span className="font-medium text-foreground">failed</span>.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="theme-toggle">Appearance</Label>
            <ThemeToggle />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            WhatsApp messaging is not connected, so no WhatsApp messages are sent.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The export contains students' personal details. Store it securely.
          </p>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={exportData}>
              <Download /> Export records as JSON
            </Button>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            All records are stored in the platform database (managed PostgreSQL);
            uploaded files are kept in private object storage.
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
          Sign-in is handled by the platform itself (hashed passwords, emailed codes, revocable sessions). Staff roles are granted by an
          administrator and cannot be self-assigned, and staff accounts must use
          two-factor authentication.
        </p>
      </section>
    </div>
  );
}
