import type { Metadata } from "next";
import { ChallengesView } from "@/components/dashboard/challenges-view";

export const metadata: Metadata = { title: "Challenges" };

export default function ChallengesPage() {
  return <ChallengesView />;
}
