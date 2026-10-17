import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { LoadingState } from "@/components/shared/states";
import { ResetPasswordForm } from "@/components/site/password-forms";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container max-w-md">
          <Suspense fallback={<LoadingState rows={3} />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
