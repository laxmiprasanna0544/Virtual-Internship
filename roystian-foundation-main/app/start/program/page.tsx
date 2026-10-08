import type { Metadata } from "next";
import { StartShell } from "@/components/start/start-shell";
import { ProgramStep } from "@/components/start/program-step";

export const metadata: Metadata = {
  title: "Choose Your Program",
  description:
    "Choose between the Self-Paced and Industry-Led Roystian virtual internship programmes.",
};

export default function StartProgramPage() {
  return (
    <StartShell
      step={4}
      title="How Would You Like To Complete Your Internship?"
      description="Both options cover the same track and end in the same verifiable certificate."
      backHref="/start/experience"
      backLabel="Back to experience"
    >
      <ProgramStep />
    </StartShell>
  );
}
