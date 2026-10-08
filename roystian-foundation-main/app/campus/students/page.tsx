import type { Metadata } from "next";
import { CampusStudents } from "@/components/campus/campus-students";

export const metadata: Metadata = { title: "Students" };

export default function CampusStudentsPage() {
  return <CampusStudents />;
}
