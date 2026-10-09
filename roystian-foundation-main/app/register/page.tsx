import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { AuthSplit } from "@/components/site/auth-split";
import { RegisterForm } from "@/components/site/register-form";
import { LoadingState } from "@/components/shared/states";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Roystian Foundation account to begin your virtual internship.",
};

export default function RegisterPage() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container">
          <AuthSplit
            image={IMAGES.studentCommunity}
            caption="Twelve domains. One completion standard. A certificate anyone can check."
            points={[
              "Your dashboard activates as soon as registration completes.",
              "You can change your domain and experience level before checkout.",
              "Your onboarding choices are kept while you sign up.",
            ]}
          >
            <div className="max-w-xl">
              <Suspense fallback={<LoadingState rows={4} />}>
                <RegisterForm />
              </Suspense>
            </div>
          </AuthSplit>
        </div>
      </section>
    </SiteShell>
  );
}
