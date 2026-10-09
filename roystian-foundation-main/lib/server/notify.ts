import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { CommunicationChannel, CommunicationEvent, NotificationType } from "@/types";

type Admin = SupabaseClient<Database>;

/** In-app notification for one user. Failures are logged, never fatal. */
export async function notify(
  admin: Admin,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  href?: string,
) {
  const { error } = await admin
    .from("notifications")
    .insert({ user_id: userId, type, title, body, href: href ?? null });
  if (error) console.error("notify failed:", error.message);
}

/**
 * Records an outbound message. Nothing is delivered yet: rows are written as
 * "queued" until an email / WhatsApp provider is connected to send them.
 */
export async function queueCommunication(
  admin: Admin,
  message: {
    event: CommunicationEvent;
    channel: CommunicationChannel;
    recipient: string;
    subject: string;
    body: string;
  },
) {
  const { error } = await admin.from("communication_logs").insert({ ...message, status: "queued" });
  if (error) console.error("queueCommunication failed:", error.message);
}
