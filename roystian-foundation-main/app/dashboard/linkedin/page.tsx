import type { Metadata } from "next";
import { LinkedInView } from "@/components/dashboard/linkedin-view";

export const metadata: Metadata = { title: "LinkedIn Profile" };

export default function LinkedInPage() {
  return <LinkedInView />;
}
