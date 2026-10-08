import type { Metadata } from "next";
import { AssessmentsList } from "@/components/dashboard/assessments-list";

export const metadata: Metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return <AssessmentsList />;
}
