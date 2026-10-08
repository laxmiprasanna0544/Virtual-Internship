import type { Metadata } from "next";
import { AdminRegistrations } from "@/components/admin/registrations";

export const metadata: Metadata = { title: "Registrations" };

export default function AdminRegistrationsPage() {
  return <AdminRegistrations />;
}
