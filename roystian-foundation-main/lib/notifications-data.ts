"use client";

import { useCallback, useEffect, useState } from "react";
import { isSignOutEvent } from "@/lib/auth";
import type { AppNotification } from "@/types";

/**
 * The signed-in user's notifications, from /api/notifications (RLS limits the
 * rows to the user's own on the server).
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json().catch(() => null)) as { notifications?: AppNotification[] } | null;
    if (data?.notifications) setNotifications(data.notifications);
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    const onSession = (event: Event) => {
      if (isSignOutEvent(event)) setNotifications([]);
      else void load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("rf-session", onSession);
    // Notifications are written by the server after enrolments, assessments
    // and reviews, so poll gently while the tab is open.
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("rf-session", onSession);
      window.clearInterval(interval);
    };
  }, [load]);

  const send = (body: unknown) =>
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);

  const markRead = useCallback(async (id: string) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await send({ id });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    await send({ all: true });
  }, []);

  return { notifications, markRead, markAllRead, reload: load };
}
