import type { Metadata } from "next";
import { AdminDomains } from "@/components/admin/domains";

export const metadata: Metadata = { title: "Domains" };

export default function AdminDomainsPage() {
  return <AdminDomains />;
}
