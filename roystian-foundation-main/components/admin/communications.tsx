"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageCircle,
  Monitor,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filters";
import { InfoNote } from "@/components/admin/info-note";
import { useAdminData } from "@/lib/admin-data";
import { COMMUNICATION_FLOWS } from "@/lib/communications";
import { formatDateTime } from "@/lib/utils";
import type { CommunicationChannel, CommunicationLog } from "@/types";

const CHANNEL_ICON: Record<CommunicationChannel, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  dashboard: Monitor,
  internal: Settings2,
};

export function AdminCommunications() {
  const db = useAdminData();
  const [query, setQuery] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("all");
  const [eventFilter, setEventFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return [...db.communications]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((entry) => {
        if (channelFilter !== "all" && entry.channel !== channelFilter) return false;
        if (eventFilter !== "all" && entry.event !== eventFilter) return false;
        if (!q) return true;
        return (
          entry.subject.toLowerCase().includes(q) ||
          entry.recipient.toLowerCase().includes(q) ||
          entry.body.toLowerCase().includes(q)
        );
      });
  }, [db, query, channelFilter, eventFilter]);

  if (!db) return <LoadingState label="Loading communications" rows={4} />;

  const columns: Column<CommunicationLog>[] = [
    {
      key: "subject",
      header: "Subject",
      primary: true,
      render: (row) => {
        const Icon = CHANNEL_ICON[row.channel];
        return (
          <span className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 truncate font-medium text-foreground">
              {row.subject}
            </span>
          </span>
        );
      },
    },
    {
      key: "recipient",
      header: "Recipient",
      render: (row) => (
        <span className="break-all text-muted-foreground">{row.recipient}</span>
      ),
    },
    {
      key: "event",
      header: "Event",
      render: (row) => (
        <span className="capitalize text-muted-foreground">
          {row.event.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (row) => (
        <span className="capitalize text-muted-foreground">{row.channel}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "date",
      header: "Sent",
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Communication Center"
        description="Automated messages triggered by programme events, and the log of everything sent."
      />

      <InfoNote>
        Emails are sent through Resend, and every message is recorded in the log below
        as sent or failed. WhatsApp is not connected, so WhatsApp steps in these flows are
        not sent.
      </InfoNote>

      {/* Flows */}
      <section className="grid gap-4 lg:grid-cols-3">
        {COMMUNICATION_FLOWS.map((flow) => (
          <div
            key={flow.event}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">{flow.title}</h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{flow.description}</p>
            <ul className="mt-4 space-y-2">
              {flow.steps.map((step) => {
                const Icon = CHANNEL_ICON[step.channel];
                return (
                  <li key={step.label} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{step.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search subject, recipient or message body"
        onReset={() => {
          setQuery("");
          setChannelFilter("all");
          setEventFilter("all");
        }}
        filters={[
          {
            id: "comm-channel",
            label: "Channels",
            value: channelFilter,
            onChange: setChannelFilter,
            options: [
              { value: "email", label: "Email" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "dashboard", label: "Dashboard" },
              { value: "internal", label: "Internal" },
            ],
          },
          {
            id: "comm-event",
            label: "Events",
            value: eventFilter,
            onChange: setEventFilter,
            options: [
              { value: "payment-success", label: "Payment success" },
              { value: "program-approaching", label: "Program approaching" },
              { value: "program-completed", label: "Program completed" },
              { value: "assessment-reminder", label: "Assessment reminder" },
              { value: "assignment-reviewed", label: "Assignment reviewed" },
            ],
          },
        ]}
      />

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {db.communications.length} log entries
      </p>

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(row) => row.id}
        emptyTitle="No communications match those filters"
        emptyDescription="Adjust the filters to see more log entries."
      />
    </div>
  );
}
