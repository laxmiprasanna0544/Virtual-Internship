"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Database, Download, Info, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DemoBadge } from "@/components/shared/demo-banner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ThemeToggle } from "@/components/shared/theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDatabase, resetDB } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export function AdminSettings() {
  const db = useDatabase();
  const router = useRouter();
  const { user } = useSession();
  const [emailSim, setEmailSim] = React.useState(true);
  const [whatsappSim, setWhatsappSim] = React.useState(true);

  if (!db) return <LoadingState label="Loading settings" rows={3} />;

  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "roystian-demo-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Demo dataset exported");
  }

  const counts = [
    { label: "Students", value: db.students.length },
    { label: "Registrations", value: db.registrations.length },
    { label: "Payments", value: db.payments.length },
    { label: "Certificates", value: db.certificates.length },
    { label: "Submissions", value: db.submissions.length },
    { label: "Communications", value: db.communications.length },
    { label: "College leads", value: db.leads.length },
    { label: "Notifications", value: db.notifications.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Environment configuration, demo data and account information."
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Environment</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Seeded {formatDateTime(db.seededAt)} · schema v{db.version}
            </p>
          </div>
          <DemoBadge />
        </div>

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
          <h2 className="text-sm font-semibold text-foreground">Communication simulation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle which simulated channels are written to the communication log.
          </p>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <Label htmlFor="sim-email">Email notifications</Label>
              <Switch id="sim-email" checked={emailSim} onCheckedChange={setEmailSim} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <Label htmlFor="sim-whatsapp">WhatsApp notifications</Label>
              <Switch
                id="sim-whatsapp"
                checked={whatsappSim}
                onCheckedChange={setWhatsappSim}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <Label htmlFor="sim-theme">Appearance</Label>
              <ThemeToggle />
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            No provider is connected in this demo, so both channels write to the local
            communication log rather than sending anything.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">Demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All records live in this browser's local storage.
          </p>
          <div className="mt-4 space-y-2.5">
            <Button variant="outline" className="w-full" onClick={exportData}>
              <Download /> Export dataset as JSON
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="w-full">
                  <RefreshCw /> Reset demo data
                </Button>
              }
              title="Reset all demo data?"
              description="Every student, registration, payment, submission and certificate in this browser returns to its seeded state. Any changes made during this session are lost."
              confirmLabel="Reset demo data"
              destructive
              onConfirm={() => {
                resetDB();
                toast.success("Demo data reset");
                router.push("/login");
              }}
            />
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Production deployments would replace this layer with a database behind the
            same service interface.
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
