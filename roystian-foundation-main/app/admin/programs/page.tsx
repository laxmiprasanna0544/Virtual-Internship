import type { Metadata } from "next";
import { AdminPrograms } from "@/components/admin/programs";

export const metadata: Metadata = { title: "Programs" };

export default function AdminProgramsPage() {
  return <AdminPrograms />;
}
