import type { Metadata } from "next";
import { OpportunitiesAdmin } from "@/components/admin/opportunities-admin";

export const metadata: Metadata = { title: "Opportunities" };

export default function AdminOpportunitiesPage() {
  return <OpportunitiesAdmin />;
}
