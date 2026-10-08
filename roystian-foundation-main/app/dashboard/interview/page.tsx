import type { Metadata } from "next";
import { InterviewView } from "@/components/dashboard/interview-view";

export const metadata: Metadata = { title: "Mock Interviews" };

export default function InterviewPage() {
  return <InterviewView />;
}
