import "server-only";

import { getSql } from "@/lib/server/db";
import { emailConfigured, sendEmail } from "@/lib/server/email";
import type { CommunicationEvent, NotificationType } from "@/types";

/** In-app notification for one user. Failures are logged, never fatal. */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  href?: string,
) {
  try {
    await getSql()`
      insert into public.notifications (user_id, type, title, body, href)
      values (${userId}, ${type}, ${title}, ${body}, ${href ?? null})`;
  } catch (error) {
    console.error("notify failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Sends a transactional email (lib/server/email.ts) and records it in the
 * communication log (sent, or failed with the reason). Never throws: the
 * action that triggered the email has already happened.
 */
export async function sendCommunication(message: {
  event: CommunicationEvent;
  recipient: string;
  subject: string;
  body: string;
}) {
  let status: "sent" | "queued" | "failed" = "queued";
  let providerMessageId: string | null = null;
  if (emailConfigured()) {
    try {
      providerMessageId = await sendEmail(message.recipient, message.subject, message.body);
      status = "sent";
    } catch (error) {
      status = "failed";
      console.error("email send failed:", error instanceof Error ? error.name : error);
    }
  }
  try {
    await getSql()`
      insert into public.communication_logs (event, channel, recipient, subject, body, status, provider_message_id)
      values (${message.event}, 'email', ${message.recipient}, ${message.subject}, ${message.body},
              ${status}, ${providerMessageId})`;
  } catch (error) {
    console.error("communication log failed:", error instanceof Error ? error.message : error);
  }
}
