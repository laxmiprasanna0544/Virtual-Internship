import type { Metadata } from "next";
import { AdminCertificates } from "@/components/admin/certificates";

export const metadata: Metadata = { title: "Certificates" };

export default function AdminCertificatesPage() {
  return <AdminCertificates />;
}
