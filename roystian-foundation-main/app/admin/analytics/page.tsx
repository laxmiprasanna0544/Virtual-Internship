import type { Metadata } from "next";
import { AdminAnalytics } from "@/components/admin/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return <AdminAnalytics />;
}
