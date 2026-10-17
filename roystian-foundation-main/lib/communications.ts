import type { CommunicationChannel, CommunicationEvent } from "@/types";

export interface CommunicationTemplate {
  channel: CommunicationChannel;
  subject: string;
  body: string;
}

/**
 * The automated communication flows described in the programme documentation.
 * Email steps are sent through Resend and recorded in the communication
 * log. WhatsApp is not connected yet, so those steps are not sent.
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
