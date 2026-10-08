"use client";

import { getDB, updateDB } from "@/lib/db";
import { uid } from "@/lib/ids";
import type { AppNotification, NotificationType } from "@/types";

export function listNotifications(userId: string | null | undefined): AppNotification[] {
  if (!userId) return [];
  return getDB()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function unreadCount(userId: string | null | undefined): number {
  return listNotifications(userId).filter((n) => !n.read).length;
}

export function pushNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  href?: string,
): AppNotification {
  const notification: AppNotification = {
    id: uid("ntf"),
    userId,
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    href,
  };
  updateDB((db) => {
    db.notifications = [notification, ...db.notifications];
  });
  return notification;
}

export function markRead(id: string): void {
  updateDB((db) => {
    db.notifications = db.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
  });
}

export function markAllRead(userId: string): void {
  updateDB((db) => {
    db.notifications = db.notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n,
    );
  });
}

export function clearNotifications(userId: string): void {
  updateDB((db) => {
    db.notifications = db.notifications.filter((n) => n.userId !== userId);
  });
}
