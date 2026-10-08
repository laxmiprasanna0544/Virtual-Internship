import type { Metadata } from "next";
import { AdminCommunications } from "@/components/admin/communications";

export const metadata: Metadata = { title: "Communications" };

export default function AdminCommunicationsPage() {
  return <AdminCommunications />;
}
