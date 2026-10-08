import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/site-shell";
import { LoginForm } from "@/components/site/login-form";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your Roystian Foundation dashboard to continue your virtual internship.",
};

export default function LoginPage() {
  return (
    <SiteShell>
      <section className="section relative overflow-hidden">
        {/* A single soft wash so the sign-in page is not a bare white sheet. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.08),transparent_70%)]"
          aria-hidden="true"
        />
        <div className="container relative max-w-5xl">
          <Suspense fallback={<LoadingState rows={3} />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  );
}
