"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DemoNote } from "@/components/shared/demo-banner";
import { DynamicIcon } from "@/components/shared/icon";
import { FilterBar } from "@/components/admin/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDatabase, updateDB } from "@/lib/db";
import { catalogDomains, type CatalogDomain } from "@/lib/catalog";

interface Draft {
  id: string;
  description: string;
  practicalBrief: string;
  active: boolean;
}

export function AdminDomains() {
  const db = useDatabase();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [draft, setDraft] = React.useState<Draft | null>(null);

  if (!db) return <LoadingState label="Loading domains" rows={4} />;

  const domains = catalogDomains(db).filter((domain) => {
    if (categoryFilter !== "all" && domain.category !== categoryFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      domain.name.toLowerCase().includes(q) ||
      domain.description.toLowerCase().includes(q)
    );
  });

  function openEdit(domain: CatalogDomain) {
    setDraft({
      id: domain.id,
      description: domain.description,
      practicalBrief: domain.practicalTask.brief,
      active: domain.active,
    });
  }

  function save() {
    if (!draft) return;
    updateDB((next) => {
      next.domainOverrides = {
        ...next.domainOverrides,
        [draft.id]: {
          description: draft.description.trim(),
          practicalBrief: draft.practicalBrief.trim(),
          active: draft.active,
        },
      };
    });
    toast.success("Domain updated");
    setDraft(null);
  }

  function toggleActive(domain: CatalogDomain) {
    updateDB((next) => {
      next.domainOverrides = {
        ...next.domainOverrides,
        [domain.id]: {
          ...(next.domainOverrides?.[domain.id] ?? {}),
          active: !domain.active,
        },
      };
    });
    toast.success(domain.active ? "Domain deactivated" : "Domain activated");
  }

  function reset(domain: CatalogDomain) {
    updateDB((next) => {
      const { [domain.id]: _removed, ...rest } = next.domainOverrides ?? {};
      next.domainOverrides = rest;
    });
    toast.success("Domain reset to its published values");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Domains"
        description="The twelve internship domains, their descriptions, modules and practical activities."
      />

      <DemoNote>
        Domain edits are stored locally and shown across the admin catalogue. Module
        content is authored in the curriculum files, so module lists are read-only here.
      </DemoNote>

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
                  <Badge variant="warning">Demo curriculum</Badge>
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
              <Button size="sm" variant="outline" onClick={() => openEdit(domain)}>
                <Pencil /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(domain)}>
                {domain.active ? "Deactivate" : "Activate"}
              </Button>
              {domain.overridden && (
                <Button size="sm" variant="ghost" onClick={() => reset(domain)}>
                  <RotateCcw /> Reset
                </Button>
              )}
              <Button asChild size="sm" variant="ghost">
                <Link href={`/internships/${domain.id}`}>
                  <ExternalLink /> Public page
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit domain</DialogTitle>
            <DialogDescription>
              Update the summary shown on cards and the practical task brief.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="d-description" className="mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="d-description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="d-brief" className="mb-2 block">
                  Practical task brief
                </Label>
                <Textarea
                  id="d-brief"
                  rows={4}
                  value={draft.practicalBrief}
                  onChange={(e) => setDraft({ ...draft, practicalBrief: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <Label htmlFor="d-active">Active</Label>
                <Switch
                  id="d-active"
                  checked={draft.active}
                  onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>
              <Check /> Save domain
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
