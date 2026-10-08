import type { Metadata } from "next";
import { Suspense } from "react";
import { StartShell } from "@/components/start/start-shell";
import { ProfileStep } from "@/components/start/profile-step";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Start Your Internship",
  description:
    "Tell us about yourself and begin your Roystian Foundation virtual internship.",
};

export default function StartPage() {
  return (
    <StartShell
      step={1}
      title="Tell Us About Yourself"
      description="A few details so we can set up your internship and your certificate correctly. This takes about a minute."
    >
      <Suspense fallback={<LoadingState rows={4} />}>
        <ProfileStep />
      </Suspense>
    </StartShell>
  );
}
