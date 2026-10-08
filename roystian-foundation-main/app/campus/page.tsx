import type { Metadata } from "next";
import { CampusOverview } from "@/components/campus/campus-overview";

export const metadata: Metadata = { title: "Overview" };

export default function CampusPage() {
  return <CampusOverview />;
}
