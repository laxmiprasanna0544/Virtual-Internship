import type { Metadata } from "next";
import { PartnerView } from "@/components/partner/partner-view";

export const metadata: Metadata = {
  title: "Talent",
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return <PartnerView />;
}
