"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  CheckCheck,
  ClipboardList,
  FileText,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/states";
import { listNotifications, markAllRead, markRead } from "@/lib/notifications";
import { useDatabase } from "@/lib/db";
import { relativeTime, cn } from "@/lib/utils";
import type { NotificationType } from "@/types";

const ICONS: Record<NotificationType, typeof Bell> = {
  success: Sparkles,
  reminder: Bell,
  assessment: ClipboardList,
  assignment: FileText,
  certificate: Award,
  system: Info,
};

export function NotificationCenter({ userId }: { userId: string }) {
  const db = useDatabase();
  const notifications = React.useMemo(
    () => (db ? listNotifications(userId) : []),
    [db, userId],
  );
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead(userId)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState
              className="m-3 border-0 bg-transparent py-8"
              title="Nothing yet"
              description="Programme updates will appear here."
            />
          ) : (
            <ul>
              {notifications.map((notification) => {
                const Icon = ICONS[notification.type];
                const body = (
                  <>
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        notification.read
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[0.68rem] text-muted-foreground">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={notification.id} className="border-b border-border last:border-0">
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => markRead(notification.id)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(notification.id)}
                        className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
