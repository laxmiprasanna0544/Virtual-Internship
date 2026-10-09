"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toNotification } from "@/lib/supabase/mappers";
import type { AppNotification } from "@/types";

/**
 * The signed-in user's notifications from Supabase. RLS limits the rows to
 * the user's own, so no user id is passed from the client.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await getSupabaseBrowserClient()
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setNotifications((data ?? []).map(toNotification));
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    // Notifications are written by the server after enrolments, assessments
    // and reviews, so poll gently while the tab is open.
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
      await getSupabaseBrowserClient().from("notifications").update({ read: true }).eq("id", id);
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    await getSupabaseBrowserClient().from("notifications").update({ read: true }).eq("read", false);
  }, []);

  return { notifications, markRead, markAllRead, reload: load };
}
