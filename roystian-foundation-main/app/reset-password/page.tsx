import type { Metadata } from "next";
import { SiteShell } from "@/components/site/site-shell";
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
          <ResetPasswordForm />
        </div>
      </section>
    </SiteShell>
  );
}
