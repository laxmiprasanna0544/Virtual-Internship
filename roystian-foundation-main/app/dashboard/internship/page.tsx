import type { Metadata } from "next";
import { InternshipView } from "@/components/dashboard/internship-view";

export const metadata: Metadata = { title: "My Internship" };

export default function InternshipPage() {
  return <InternshipView />;
}
