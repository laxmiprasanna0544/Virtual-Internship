"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynamicIcon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/states";
import { DOMAINS } from "@/data/domains";
import { getDraft, saveDraft } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export function DomainStep() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setSelected(getDraft().domainId);
    setReady(true);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOMAINS;
    return DOMAINS.filter(
      (domain) =>
        domain.name.toLowerCase().includes(q) ||
        domain.description.toLowerCase().includes(q) ||
        domain.category.toLowerCase().includes(q),
    );
  }, [query]);

  function choose(domainId: string) {
    setSelected(domainId);
    saveDraft({ domainId });
  }

  function handleContinue() {
    if (!selected) return;
    saveDraft({ domainId: selected });
    router.push("/start/experience");
  }

  if (!ready) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search domains"
          className="pl-10"
          aria-label="Search domains"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No domains match that search"
          description="Try a different keyword, or clear the search to see all twelve domains."
          actionLabel="Clear search"
          onAction={() => setQuery("")}
        />
      ) : (
        <ul
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="radiogroup"
          aria-label="Available domains"
        >
          {filtered.map((domain) => {
            const active = selected === domain.id;
            return (
              <li key={domain.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choose(domain.id)}
                  className={cn(
                    "group flex h-full w-full flex-col rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-primary bg-primary/[0.05] shadow-card"
                      : "border-border bg-card shadow-soft hover:-translate-y-0.5 hover:border-primary/35",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/8 text-primary",
                      )}
                    >
                      <DynamicIcon name={domain.icon} className="h-4 w-4" />
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <span className="mt-3 block text-sm font-semibold text-foreground">
                    {domain.name}
                  </span>
                  <span className="mt-1 block flex-1 text-xs leading-relaxed text-muted-foreground">
                    {domain.description}
                  </span>
                  <span className="mt-3 block text-[0.7rem] text-muted-foreground">
                    {domain.modules.length} modules · {domain.levels.length} levels
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Not sure yet?{" "}
          <Link href="/domains" className="text-primary hover:underline">
            Read the full domain pages
          </Link>{" "}
          — your progress is saved.
        </p>
        <Button size="lg" onClick={handleContinue} disabled={!selected}>
          Continue to experience <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
