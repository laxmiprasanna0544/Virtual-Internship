import type { Metadata } from "next";
import { Suspense } from "react";
import { DomainsView } from "@/components/dashboard/domains-view";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = { title: "Explore & Enroll in Domains" };

export default function DomainsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading domain catalogue" rows={3} />}>
      <DomainsView />
    </Suspense>
  );
}
