"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { InfoNote } from "@/components/admin/info-note";
import { DynamicIcon } from "@/components/shared/icon";
import { FilterBar } from "@/components/admin/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";

export function AdminDomains() {
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const domains = DOMAINS.filter((domain) => {
    if (categoryFilter !== "all" && domain.category !== categoryFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      domain.name.toLowerCase().includes(q) ||
      domain.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Domains"
        description="The twelve internship domains, their descriptions, modules and practical activities."
      />

      <InfoNote>
        The domain catalogue — descriptions, modules, assessments and practical tasks — is
        maintained in the codebase and released with the application, so every change is
        reviewed and versioned. This view is read-only.
      </InfoNote>

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search domains"
        onReset={() => {
          setQuery("");
          setCategoryFilter("all");
        }}
        filters={[
          {
            id: "domain-category",
            label: "Categories",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: ["Technology", "Data", "Business", "Engineering", "Impact"].map(
              (category) => ({ value: category, label: category }),
            ),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {domains.map((domain) => (
          <article
            key={domain.id}
            className={`rounded-2xl border bg-card p-5 shadow-soft ${
              domain.active ? "border-border" : "border-dashed border-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <DynamicIcon name={domain.icon} className="h-[1.05rem] w-[1.05rem]" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {domain.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {domain.category} · {domain.modules.length} modules ·{" "}
                    {domain.levels.length} levels
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant={domain.active ? "success" : "secondary"}>
                  {domain.active ? "Active" : "Inactive"}
                </Badge>
                {domain.curriculumSource === "demo" && (
                  <Badge variant="warning">Curriculum in draft</Badge>
                )}
              </div>
            </div>

            <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
              {domain.description}
            </p>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Practical task
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {domain.practicalTask.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {domain.practicalTask.brief}
              </p>
            </div>

            <details className="mt-3.5">
              <summary className="cursor-pointer text-xs font-medium text-primary">
                View modules ({domain.modules.length})
              </summary>
              <ol className="mt-2.5 space-y-1">
                {domain.modules.map((m) => (
                  <li key={m.id} className="text-xs text-muted-foreground">
                    <span className="mr-2 font-mono text-primary">
                      {String(m.number).padStart(2, "0")}
                    </span>
                    {m.title}
                  </li>
                ))}
              </ol>
            </details>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/internships/${domain.id}`}>
                  <ExternalLink /> Public page
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
