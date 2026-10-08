import type { Metadata } from "next";
import { ScholarshipView } from "@/components/dashboard/scholarship-view";

export const metadata: Metadata = { title: "Skill Scholarship" };

export default function ScholarshipPage() {
  return <ScholarshipView />;
}
