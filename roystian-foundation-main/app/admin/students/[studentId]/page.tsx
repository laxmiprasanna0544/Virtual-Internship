import type { Metadata } from "next";
import { AdminStudentDetail } from "@/components/admin/student-detail";

export const metadata: Metadata = { title: "Student" };

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function AdminStudentDetailPage({ params }: PageProps) {
  const { studentId } = await params;
  return <AdminStudentDetail studentId={studentId} />;
}
