import type { Metadata } from "next";
import { FellowshipView } from "@/components/dashboard/fellowship-view";

export const metadata: Metadata = { title: "Talent Fellowship" };

export default function FellowshipPage() {
  return <FellowshipView />;
}
