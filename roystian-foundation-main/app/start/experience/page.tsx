import type { Metadata } from "next";
import { StartShell } from "@/components/start/start-shell";
import { ExperienceStep } from "@/components/start/experience-step";

export const metadata: Metadata = {
  title: "Choose Your Experience Level",
  description:
    "Pick the experience level that matches where you are and see your recommended learning track.",
};

export default function StartExperiencePage() {
  return (
    <StartShell
      step={3}
      title="What Is Your Experience Level?"
      description="Be honest here — the level sets the depth of the material and the style of the assessments."
      backHref="/start/domain"
      backLabel="Back to domain"
    >
      <ExperienceStep />
    </StartShell>
  );
}
