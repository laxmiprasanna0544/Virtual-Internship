import type { Metadata } from "next";
import { AdminLeads } from "@/components/admin/leads";

export const metadata: Metadata = { title: "College Leads" };

export default function AdminLeadsPage() {
  return <AdminLeads />;
}
