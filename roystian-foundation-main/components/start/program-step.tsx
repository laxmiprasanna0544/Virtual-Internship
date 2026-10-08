"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/site/program-card";
import { CompareProgramsButton } from "@/components/site/program-comparison";
import { EmptyState } from "@/components/shared/states";
import { DynamicIcon } from "@/components/shared/icon";
import { PROGRAMS } from "@/data/programs";
import { getDomain } from "@/data/domains";
import { EXPERIENCE_LEVELS } from "@/data/content";
import { getDraft, saveDraft } from "@/lib/onboarding";
import type { OnboardingDraft, ProgramId } from "@/types";

export function ProgramStep() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<OnboardingDraft | null>(null);

  React.useEffect(() => {
    setDraft(getDraft());
  }, []);

  if (!draft) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!draft.domainId || !draft.experience) {
    return (
      <EmptyState
        title="Finish the earlier steps first"
        description="Choose a domain and an experience level so we can set up the right internship for you."
        actionLabel="Choose a domain"
        actionHref="/start/domain"
      />
    );
  }

  const domain = getDomain(draft.domainId);
  const level = EXPERIENCE_LEVELS.find((e) => e.value === draft.experience);

  function select(programId: ProgramId) {
    const next = saveDraft({ programId });
    setDraft(next);
    router.push("/checkout");
  }

  return (
    <div className="space-y-8">
      {domain && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <DynamicIcon name={domain.icon} className="h-[1.1rem] w-[1.1rem]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {domain.name} · {level?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {domain.modules.length} modules · 15 days · certificate on completion
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/start/experience")}>
            Change
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {PROGRAMS.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            selected={draft.programId === program.id}
            onSelect={() => select(program.id)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
        <CompareProgramsButton size="default" />
        <Button
          size="lg"
          disabled={!draft.programId}
          onClick={() => router.push("/checkout")}
        >
          Continue to checkout <ArrowRight />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Certificates are issued only after all completion requirements are met. For the guided
        Industry-Led programme, the certificate will be generated only after the completion of live
        classes, that is the duration period mentioned which is 15 days. No guaranteed placement is
        promised with either programme.
      </p>
    </div>
  );
}
