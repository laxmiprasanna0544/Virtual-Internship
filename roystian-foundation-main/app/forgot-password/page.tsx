import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { LoadingState } from "@/components/shared/states";
import { ForgotPasswordForm } from "@/components/site/password-forms";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container max-w-md">
          <Suspense fallback={<LoadingState rows={3} />}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
