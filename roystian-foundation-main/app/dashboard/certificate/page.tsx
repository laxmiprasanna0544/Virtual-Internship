import type { Metadata } from "next";
import { CertificateView } from "@/components/dashboard/certificate-view";

export const metadata: Metadata = { title: "Certificate" };

export default function CertificatePage() {
  return <CertificateView />;
}
