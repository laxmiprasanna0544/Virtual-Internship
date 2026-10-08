"use client";

import * as React from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DemoNote } from "@/components/shared/demo-banner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { catalogPrograms, type CatalogProgram } from "@/lib/catalog";
import { uid } from "@/lib/ids";
import { formatINR } from "@/lib/utils";

interface Draft {
  id: string;
  name: string;
  price: string;
  durationLabel: string;
  tagline: string;
  description: string;
  bestFor: string;
  features: string;
  certificateEnabled: boolean;
  pehlaChanceIncluded: boolean;
  liveSessions: boolean;
  active: boolean;
  custom: boolean;
  isNew: boolean;
}

function toDraft(program: CatalogProgram): Draft {
  return {
    id: program.id,
    name: program.name,
    price: String(program.price),
    durationLabel: program.durationLabel,
    tagline: program.tagline,
    description: program.description,
    bestFor: program.bestFor,
    features: program.features.join("\n"),
    certificateEnabled: program.certificateEnabled,
    pehlaChanceIncluded: program.pehlaChanceIncluded,
    liveSessions: program.liveSessions,
    active: program.active,
    custom: program.custom,
    isNew: false,
  };
}

const EMPTY_DRAFT: Draft = {
  id: "",
  name: "",
  price: "2500",
  durationLabel: "15 Days",
  tagline: "",
  description: "",
  bestFor: "",
  features: "Domain-specific learning content\nModule assessments\nPractical activities",
  certificateEnabled: true,
  pehlaChanceIncluded: false,
  liveSessions: false,
  active: true,
  custom: true,
  isNew: true,
};

export function AdminPrograms() {
  const db = useDatabase();
  const [draft, setDraft] = React.useState<Draft | null>(null);

  if (!db) return <LoadingState label="Loading programmes" rows={3} />;

  const programs = catalogPrograms(db);

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Give the programme a name.");
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price.");
      return;
    }

    const payload = {
      name: draft.name.trim(),
      price,
      durationLabel: draft.durationLabel.trim(),
      tagline: draft.tagline.trim(),
      description: draft.description.trim(),
      bestFor: draft.bestFor.trim(),
      features: draft.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      certificateEnabled: draft.certificateEnabled,
      pehlaChanceIncluded: draft.pehlaChanceIncluded,
      liveSessions: draft.liveSessions,
      active: draft.active,
    };

    updateDB((next) => {
      if (draft.isNew) {
        next.customPrograms = [
          ...(next.customPrograms ?? []),
          { id: uid("prg"), ...payload },
        ];
      } else if (draft.custom) {
        next.customPrograms = (next.customPrograms ?? []).map((program) =>
          program.id === draft.id ? { ...program, ...payload } : program,
        );
      } else {
        next.programOverrides = {
          ...next.programOverrides,
          [draft.id]: payload,
        };
      }
    });

    toast.success(draft.isNew ? "Programme created" : "Programme updated");
    setDraft(null);
  }

  function toggleActive(program: CatalogProgram) {
    updateDB((next) => {
      if (program.custom) {
        next.customPrograms = (next.customPrograms ?? []).map((p) =>
          p.id === program.id ? { ...p, active: !program.active } : p,
        );
      } else {
        next.programOverrides = {
          ...next.programOverrides,
          [program.id]: {
            ...(next.programOverrides?.[program.id] ?? {}),
            active: !program.active,
          },
        };
      }
    });
    toast.success(program.active ? "Programme deactivated" : "Programme activated");
  }

  function resetProgram(program: CatalogProgram) {
    updateDB((next) => {
      const { [program.id]: _removed, ...rest } = next.programOverrides ?? {};
      next.programOverrides = rest;
    });
    toast.success("Programme reset to its published values");
  }

  function deleteProgram(program: CatalogProgram) {
    updateDB((next) => {
      next.customPrograms = (next.customPrograms ?? []).filter(
        (p) => p.id !== program.id,
      );
    });
    toast.success("Programme deleted");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Programs"
        description="Create, edit and activate the programmes offered with each internship."
        action={
          <Button onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            <Plus /> Create Program
          </Button>
        }
      />

      <DemoNote>
        Catalogue edits are stored in this browser and shown across the admin catalogue.
        The public marketing pages render the published catalogue, so they continue to
        show the two documented programmes.
      </DemoNote>

      <div className="grid gap-5 lg:grid-cols-2">
        {programs.map((program) => (
          <article
            key={program.id}
            className={`min-w-0 rounded-2xl border bg-card p-5 shadow-soft ${
              program.active ? "border-border" : "border-dashed border-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold text-foreground">
                  {program.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{program.tagline}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant={program.active ? "success" : "secondary"}>
                  {program.active ? "Active" : "Inactive"}
                </Badge>
                {program.custom && <Badge variant="outline">Custom</Badge>}
              </div>
            </div>

            <p className="mt-4 font-display text-2xl font-semibold text-foreground">
              {formatINR(program.price)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {program.durationLabel}
              </span>
            </p>

            <ul className="mt-4 space-y-1.5">
              {program.features.slice(0, 5).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {program.features.length > 5 && (
                <li className="text-xs text-muted-foreground">
                  +{program.features.length - 5} more
                </li>
              )}
            </ul>

            <dl className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
              <Badge variant={program.certificateEnabled ? "default" : "secondary"}>
                Certificate {program.certificateEnabled ? "enabled" : "disabled"}
              </Badge>
              <Badge variant={program.pehlaChanceIncluded ? "default" : "secondary"}>
                PehlaChance {program.pehlaChanceIncluded ? "included" : "not included"}
              </Badge>
              <Badge variant={program.liveSessions ? "default" : "secondary"}>
                {program.liveSessions ? "Live sessions" : "Self-paced"}
              </Badge>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft(toDraft(program))}>
                <Pencil /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(program)}>
                {program.active ? "Deactivate" : "Activate"}
              </Button>
              {!program.custom && db.programOverrides?.[program.id] && (
                <Button size="sm" variant="ghost" onClick={() => resetProgram(program)}>
                  <RotateCcw /> Reset
                </Button>
              )}
              {program.custom && (
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost">
                      <Trash2 /> Delete
                    </Button>
                  }
                  title={`Delete ${program.name}?`}
                  description="This custom programme will be removed from the catalogue."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() => deleteProgram(program)}
                />
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.isNew ? "Create Program" : "Edit Program"}</DialogTitle>
            <DialogDescription>
              Programme details shown in the admin catalogue.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Program Name" id="p-name">
                <Input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Price (₹)" id="p-price">
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </Field>
              <Field label="Duration" id="p-duration">
                <Input
                  id="p-duration"
                  value={draft.durationLabel}
                  onChange={(e) => setDraft({ ...draft, durationLabel: e.target.value })}
                />
              </Field>
              <Field label="Tagline" id="p-tagline">
                <Input
                  id="p-tagline"
                  value={draft.tagline}
                  onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" id="p-description">
                  <Textarea
                    id="p-description"
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Best for" id="p-bestfor">
                  <Input
                    id="p-bestfor"
                    value={draft.bestFor}
                    onChange={(e) => setDraft({ ...draft, bestFor: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Features (one per line)" id="p-features">
                  <Textarea
                    id="p-features"
                    rows={6}
                    value={draft.features}
                    onChange={(e) => setDraft({ ...draft, features: e.target.value })}
                  />
                </Field>
              </div>

              <div className="space-y-3 sm:col-span-2">
                {[
                  { key: "certificateEnabled" as const, label: "Certificate enabled" },
                  { key: "pehlaChanceIncluded" as const, label: "PehlaChance included" },
                  { key: "liveSessions" as const, label: "Live sessions" },
                  { key: "active" as const, label: "Active" },
                ].map((toggle) => (
                  <div
                    key={toggle.key}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <Label htmlFor={`p-${toggle.key}`}>{toggle.label}</Label>
                    <Switch
                      id={`p-${toggle.key}`}
                      checked={draft[toggle.key]}
                      onCheckedChange={(checked) =>
                        setDraft({ ...draft, [toggle.key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>
              <Check /> Save programme
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      {children}
    </div>
  );
}
