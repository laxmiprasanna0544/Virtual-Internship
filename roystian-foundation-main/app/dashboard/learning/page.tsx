import type { Metadata } from "next";
import { LearningList } from "@/components/dashboard/learning-list";

export const metadata: Metadata = { title: "Learning" };

export default function LearningPage() {
  return <LearningList />;
}
