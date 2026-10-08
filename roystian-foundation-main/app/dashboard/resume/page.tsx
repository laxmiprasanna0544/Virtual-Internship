import type { Metadata } from "next";
import { ResumeView } from "@/components/dashboard/resume-view";

export const metadata: Metadata = { title: "Resume" };

export default function ResumePage() {
  return <ResumeView />;
}
