import type { Metadata } from "next";
import { SiteShell } from "@/components/site/site-shell";
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
          <ForgotPasswordForm />
        </div>
      </section>
    </SiteShell>
  );
}
