import type { Metadata } from "next";
import { ProjectReview } from "@/components/admin/project-review";

export const metadata: Metadata = { title: "Project Submissions" };

export default function AdminProjectsPage() {
  return <ProjectReview />;
}
