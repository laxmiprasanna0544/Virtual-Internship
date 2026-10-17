import type { Metadata } from "next";
import { Suspense } from "react";
import { SecurityView } from "@/components/account/security-view";
import { LoadingState } from "@/components/shared/states";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Account Security",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container max-w-2xl">
          <Suspense fallback={<LoadingState rows={3} />}>
            <SecurityView />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
