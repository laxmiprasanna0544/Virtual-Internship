import type { Metadata } from "next";
import { AssignmentView } from "@/components/dashboard/assignment-view";

export const metadata: Metadata = { title: "Assignments" };

export default function AssignmentsPage() {
  return <AssignmentView />;
}
