"use client";

import { getDB, updateDB } from "@/lib/db";
import { uid } from "@/lib/ids";
import type {
  CommunicationChannel,
  CommunicationEvent,
  CommunicationLog,
} from "@/types";

export interface CommunicationTemplate {
  channel: CommunicationChannel;
  subject: string;
  body: string;
}

/**
 * The automated communication flows described in the programme documentation.
 * In the demo these are simulated and written to a local log rather than sent.
 */
export const COMMUNICATION_FLOWS: {
  event: CommunicationEvent;
  title: string;
  description: string;
  steps: { channel: CommunicationChannel; label: string }[];
}[] = [
  {
    event: "payment-success",
    title: "Payment Success",
    description: "Triggered the moment a registration payment is confirmed.",
    steps: [
      { channel: "internal", label: "Account created" },
      { channel: "dashboard", label: "Dashboard activated" },
      { channel: "email", label: "Confirmation email sent" },
      { channel: "whatsapp", label: "WhatsApp confirmation sent" },
      { channel: "internal", label: "Admin updated" },
      { channel: "internal", label: "Trainer notified" },
    ],
  },
  {
    event: "program-approaching",
    title: "Program Approaching",
    description: "Sent as the completion window approaches.",
    steps: [
      { channel: "email", label: "Email reminder" },
      { channel: "whatsapp", label: "WhatsApp reminder" },
      { channel: "dashboard", label: "Dashboard notification" },
    ],
  },
  {
    event: "program-completed",
    title: "Program Completed",
    description: "Runs once all completion requirements are satisfied.",
    steps: [
      { channel: "internal", label: "Certificate ID generated" },
      { channel: "email", label: "Certificate emailed" },
      { channel: "dashboard", label: "Verification page activated" },
      { channel: "internal", label: "PehlaChance activated for ₹5,000 students" },
    ],
  },
];

export function logCommunication(
  event: CommunicationEvent,
  channel: CommunicationChannel,
  recipient: string,
  subject: string,
  body: string,
  status: CommunicationLog["status"] = "sent",
): CommunicationLog {
  const entry: CommunicationLog = {
    id: uid("com"),
    event,
    channel,
    recipient,
    subject,
    body,
    status,
    createdAt: new Date().toISOString(),
  };
  updateDB((db) => {
    db.communications = [entry, ...db.communications];
  });
  return entry;
}

export function listCommunications(): CommunicationLog[] {
  return [...getDB().communications].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function runPaymentSuccessFlow(params: {
  name: string;
  email: string;
  mobile: string;
  registrationId: string;
  domainName: string;
  programName: string;
}): CommunicationLog[] {
  const first = params.name.split(" ")[0];
  return [
    logCommunication(
      "payment-success",
      "email",
      params.email,
      `Welcome to Roystian Foundation — ${params.domainName} Virtual Internship`,
      `Hi ${first}, your registration ${params.registrationId} for the ${params.programName} is confirmed. Your dashboard is now active.`,
    ),
    logCommunication(
      "payment-success",
      "whatsapp",
      params.mobile || "—",
      "Registration confirmed",
      `Hi ${first}, your Roystian virtual internship (${params.domainName}) is confirmed. Registration ID ${params.registrationId}.`,
    ),
    logCommunication(
      "payment-success",
      "dashboard",
      params.email,
      "Dashboard activated",
      "Your learning modules, assessments and practical activity are now available.",
    ),
    logCommunication(
      "payment-success",
      "internal",
      "Programme team",
      "New registration",
      `${params.name} registered for ${params.domainName} — ${params.programName}.`,
    ),
  ];
}

export function runCompletionFlow(params: {
  name: string;
  email: string;
  certificateId: string;
  domainName: string;
  pehlaChance: boolean;
}): CommunicationLog[] {
  const logs = [
    logCommunication(
      "program-completed",
      "internal",
      "Certificate service",
      "Certificate ID generated",
      `Certificate ${params.certificateId} generated for ${params.name}.`,
    ),
    logCommunication(
      "program-completed",
      "email",
      params.email,
      "Your Roystian internship certificate is ready",
      `Congratulations ${params.name.split(" ")[0]} — your ${params.domainName} internship certificate (${params.certificateId}) is available in your dashboard.`,
    ),
    logCommunication(
      "program-completed",
      "dashboard",
      params.email,
      "Verification page activated",
      `Public verification for ${params.certificateId} is now live.`,
    ),
  ];
  if (params.pehlaChance) {
    logs.push(
      logCommunication(
        "program-completed",
        "internal",
        params.email,
        "PehlaChance activated",
        "One month of PehlaChance access has been activated for this student.",
      ),
    );
  }
  return logs;
}
