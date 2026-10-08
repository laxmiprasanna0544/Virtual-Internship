import type { Metadata } from "next";
import { AssistantView } from "@/components/dashboard/assistant-view";

export const metadata: Metadata = { title: "Career Assistant" };

export default function AssistantPage() {
  return <AssistantView />;
}
