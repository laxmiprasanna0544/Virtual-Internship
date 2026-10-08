"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { DemoNote } from "@/components/shared/demo-banner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { catalogTrainers } from "@/lib/catalog";
import { DOMAINS } from "@/data/domains";
import { TRAINERS } from "@/data/trainers";
import { uid } from "@/lib/ids";
import { initials as toInitials } from "@/lib/utils";
import type { Trainer } from "@/types";

const EMPTY: Trainer = {
  id: "",
  name: "",
  role: "",
  industry: "",
  experience: "",
  specialization: "",
  linkedin: "https://www.linkedin.com/in/demo-profile",
  bio: "Demo profile created for this environment.",
  domains: [],
  initials: "",
  accent: "indigo",
  active: true,
};

export function AdminTrainers() {
  const db = useDatabase();
  const [draft, setDraft] = React.useState<(Trainer & { isNew: boolean }) | null>(null);

  if (!db) return <LoadingState label="Loading trainers" rows={3} />;

  const trainers = catalogTrainers(db);
  const isSeeded = (id: string) => TRAINERS.some((t) => t.id === id);

  function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.role.trim()) {
      toast.error("Name and role are required.");
      return;
    }
    const payload: Trainer = {
      ...draft,
      name: draft.name.trim(),
      initials: draft.initials.trim() || toInitials(draft.name.trim()),
    };

    updateDB((next) => {
      if (draft.isNew) {
        next.customTrainers = [
          ...(next.customTrainers ?? []),
          { ...payload, id: uid("trn") },
        ];
      } else if (isSeeded(draft.id)) {
        next.trainerOverrides = {
          ...next.trainerOverrides,
          [draft.id]: payload,
        };
      } else {
        next.customTrainers = (next.customTrainers ?? []).map((t) =>
          t.id === draft.id ? payload : t,
        );
      }
    });

    toast.success(draft.isNew ? "Trainer added" : "Trainer updated");
    setDraft(null);
  }

  function toggleActive(trainer: Trainer) {
    updateDB((next) => {
      if (isSeeded(trainer.id)) {
        next.trainerOverrides = {
          ...next.trainerOverrides,
          [trainer.id]: {
            ...(next.trainerOverrides?.[trainer.id] ?? {}),
            active: !trainer.active,
          },
        };
      } else {
        next.customTrainers = (next.customTrainers ?? []).map((t) =>
          t.id === trainer.id ? { ...t, active: !trainer.active } : t,
        );
      }
    });
    toast.success(trainer.active ? "Trainer deactivated" : "Trainer activated");
  }

  function remove(trainer: Trainer) {
    updateDB((next) => {
      next.customTrainers = (next.customTrainers ?? []).filter(
        (t) => t.id !== trainer.id,
      );
    });
    toast.success("Trainer removed");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trainers"
        description="Trainer profiles assigned to the Industry-Led programme across domains."
        action={
          <Button onClick={() => setDraft({ ...EMPTY, isNew: true })}>
            <Plus /> Add trainer
          </Button>
        }
      />

      <DemoNote>
        Every profile here is an illustrative persona created for the demonstration
        environment. They are not real individuals and carry no real credentials.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer) => (
          <article
            key={trainer.id}
            className={`flex flex-col rounded-2xl border bg-card p-5 shadow-soft ${
              trainer.active ? "border-border" : "border-dashed border-border opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 font-display text-sm font-semibold text-primary">
                {trainer.initials || toInitials(trainer.name)}
              </span>
              <Badge variant={trainer.active ? "success" : "secondary"}>
                {trainer.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <h2 className="mt-3.5 text-sm font-semibold text-foreground">
              {trainer.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trainer.role} · {trainer.industry}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {trainer.experience} · {trainer.specialization}
            </p>
            <p className="mt-2.5 flex-1 text-xs leading-relaxed text-muted-foreground">
              {trainer.bio}
            </p>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {trainer.domains.map((domainId) => (
                <span
                  key={domainId}
                  className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                >
                  {DOMAINS.find((d) => d.id === domainId)?.shortName ?? domainId}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDraft({ ...trainer, isNew: false })}
              >
                <Pencil /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(trainer)}>
                {trainer.active ? "Deactivate" : "Activate"}
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/trainers/${trainer.id}`}>
                  <ExternalLink /> Profile
                </Link>
              </Button>
              {!isSeeded(trainer.id) && (
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost">
                      <Trash2 /> Delete
                    </Button>
                  }
                  title={`Remove ${trainer.name}?`}
                  description="This trainer profile will be deleted from the catalogue."
                  confirmLabel="Remove"
                  destructive
                  onConfirm={() => remove(trainer)}
                />
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {draft?.isNew ? "Add trainer" : "Edit trainer"}
            </DialogTitle>
            <DialogDescription>
              Profiles are labelled as demo data wherever they appear.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "name" as const, label: "Name" },
                { key: "role" as const, label: "Role" },
                { key: "industry" as const, label: "Industry" },
                { key: "experience" as const, label: "Experience" },
                { key: "specialization" as const, label: "Specialization" },
                { key: "initials" as const, label: "Initials" },
              ].map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`t-${field.key}`} className="mb-2 block">
                    {field.label}
                  </Label>
                  <Input
                    id={`t-${field.key}`}
                    value={draft[field.key]}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="sm:col-span-2">
                <Label htmlFor="t-linkedin" className="mb-2 block">
                  LinkedIn
                </Label>
                <Input
                  id="t-linkedin"
                  value={draft.linkedin}
                  onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="t-bio" className="mb-2 block">
                  Bio
                </Label>
                <Textarea
                  id="t-bio"
                  rows={3}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="mb-2.5 text-sm font-medium">Assigned domains</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DOMAINS.map((domain) => {
                    const checked = draft.domains.includes(domain.id);
                    return (
                      <label
                        key={domain.id}
                        htmlFor={`t-domain-${domain.id}`}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <Checkbox
                          id={`t-domain-${domain.id}`}
                          checked={checked}
                          onCheckedChange={() =>
                            setDraft({
                              ...draft,
                              domains: checked
                                ? draft.domains.filter((d) => d !== domain.id)
                                : [...draft.domains, domain.id],
                            })
                          }
                        />
                        <span className="text-foreground">{domain.shortName}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
                <Label htmlFor="t-active">Active</Label>
                <Switch
                  id="t-active"
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
              <Check /> Save trainer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {trainers.length === 0 && (
        <div className="flex justify-center">
          <Button onClick={() => setDraft({ ...EMPTY, isNew: true })}>
            <UserCog /> Add the first trainer
          </Button>
        </div>
      )}
    </div>
  );
}
