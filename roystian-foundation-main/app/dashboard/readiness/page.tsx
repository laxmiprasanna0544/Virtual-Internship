import type { Metadata } from "next";
import { ReadinessView } from "@/components/dashboard/readiness-view";

export const metadata: Metadata = { title: "Career Readiness" };

export default function ReadinessPage() {
  return <ReadinessView />;
}
