import type { Metadata } from "next";
import { BadgesView } from "@/components/dashboard/badges-view";

export const metadata: Metadata = { title: "Skill Badges" };

export default function BadgesPage() {
  return <BadgesView />;
}
