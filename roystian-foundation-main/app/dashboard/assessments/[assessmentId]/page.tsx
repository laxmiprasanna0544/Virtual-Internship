import type { Metadata } from "next";
import { AssessmentRunner } from "@/components/dashboard/assessment-runner";

export const metadata: Metadata = { title: "Assessment" };

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function AssessmentPage({ params }: PageProps) {
  const { assessmentId } = await params;
  return <AssessmentRunner assessmentId={assessmentId} />;
}
