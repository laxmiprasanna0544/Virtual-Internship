import type { Metadata } from "next";
import { StartShell } from "@/components/start/start-shell";
import { DomainStep } from "@/components/start/domain-step";

export const metadata: Metadata = {
  title: "Choose Your Domain",
  description: "Select the domain for your Roystian virtual internship.",
};

export default function StartDomainPage() {
  return (
    <StartShell
      step={2}
      title="Choose Your Domain"
      description="Pick the field you want to work in. Every domain has ten modules, assessments and a practical activity."
      backHref="/start"
      backLabel="Back to profile"
    >
      <DomainStep />
    </StartShell>
  );
}
