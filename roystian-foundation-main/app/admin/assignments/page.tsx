import type { Metadata } from "next";
import { AdminAssignments } from "@/components/admin/assignments";

export const metadata: Metadata = { title: "Assignments" };

export default function AdminAssignmentsPage() {
  return <AdminAssignments />;
}
