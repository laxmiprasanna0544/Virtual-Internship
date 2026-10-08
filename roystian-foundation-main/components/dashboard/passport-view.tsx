"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  IdCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ensurePassport, updatePassport, useCareerContext } from "@/lib/career";
import { useStudentContext } from "@/lib/use-student";
import { delay } from "@/lib/api";
import type { CareerPassport } from "@/types";

type VisibilityKey = keyof CareerPassport["visibility"];

const VISIBILITY_FIELDS: { key: VisibilityKey; label: string; detail: string }[] =
  [
    {
      key: "readiness",
      label: "Career Readiness Score",
      detail: "Your score and the five-area breakdown.",
    },
    {
      key: "projects",
      label: "Projects",
      detail: "Evaluated project work and scores.",
    },
    {
      key: "assessments",
      label: "Assessments",
      detail: "Module and final assessment results.",
    },
    { key: "badges", label: "Skill Badges", detail: "Badges you have earned." },
    {
      key: "certificate",
      label: "Certificate",
      detail: "Your certificate ID and verification link.",
    },
    {
      key: "contact",
      label: "Contact details",
      detail: "Your email address. Off by default.",
    },
  ];

export function PassportView() {
  const { ready, student, domain, certificate } = useStudentContext();
  const career = useCareerContext();

  const [headline, setHeadline] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => setOrigin(window.location.origin), []);

  // Create the passport on first visit so the student always has one to edit.
  React.useEffect(() => {
    if (ready && student && !career.passport) {
      ensurePassport(student);
    }
  }, [ready, student, career.passport]);

  React.useEffect(() => {
    if (hydrated || !career.passport) return;
    setHeadline(career.passport.headline);
    setAbout(career.passport.about);
    setSlug(career.passport.slug);
    setHydrated(true);
  }, [career.passport, hydrated]);

  if (!ready || !career.ready) {
    return <LoadingState label="Loading your passport" rows={3} />;
  }

  const passport = career.passport;
  if (!passport) return <LoadingState label="Preparing your passport" rows={3} />;

  const publicUrl = `${origin}/profile/${passport.slug}`;

  async function handleSave() {
    if (!student) return;
    setBusy(true);
    await delay(400);
    updatePassport(student.id, { headline, about, slug });
    setBusy(false);
    toast.success("Passport updated");
  }

  function togglePublished(next: boolean) {
    if (!student) return;
    updatePassport(student.id, { published: next });
    toast.success(next ? "Passport published" : "Passport unpublished", {
      description: next
        ? "Anyone with the link can now view it."
        : "The public link now returns a not-found page.",
    });
  }

  function toggleVisibility(key: VisibilityKey, next: boolean) {
    if (!student) return;
    updatePassport(student.id, {
      visibility: { ...passport!.visibility, [key]: next },
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  }

  return (
    <div>
      <PageHeader
        title="Career Passport"
        description="A single, shareable record of your professional development. You control what it shows and whether it is public."
        action={
          <Button asChild variant="outline" className="group">
            <Link href={`/profile/${passport.slug}`} target="_blank">
              Preview <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Editor ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <IdCard className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Profile
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  className="mt-2"
                  value={headline}
                  maxLength={90}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={
                    domain
                      ? `${domain.shortName} intern · Roystian Foundation`
                      : "Roystian Foundation intern"
                  }
                />
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  {headline.length} / 90 characters
                </p>
              </div>

              <div>
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  rows={5}
                  className="mt-2"
                  value={about}
                  maxLength={600}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Two or three sentences on what you worked on and what you can do. Write it for someone deciding whether to interview you."
                />
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  {about.length} / 600 characters
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Public link</Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="shrink-0 font-mono text-[0.78rem] text-muted-foreground">
                    /profile/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                  Letters, numbers and hyphens. If the link is taken, a number is
                  appended.
                </p>
              </div>

              <Button onClick={handleSave} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check /> Save changes
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* ── Visibility ───────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              What the public profile shows
            </h2>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted-foreground">
              Turn off anything you would rather not share. Nothing is shown
              that you have not earned.
            </p>

            <div className="mt-5 divide-y divide-border">
              {VISIBILITY_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[0.88rem] font-medium text-foreground">
                      {field.label}
                    </p>
                    <p className="mt-0.5 text-[0.76rem] leading-relaxed text-muted-foreground">
                      {field.detail}
                    </p>
                  </div>
                  <Switch
                    checked={passport.visibility[field.key]}
                    onCheckedChange={(next) => toggleVisibility(field.key, next)}
                    aria-label={`Show ${field.label}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Publish panel ──────────────────────────────────────────── */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-[0.95rem] font-semibold text-foreground">
                Publishing
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <p className="flex items-center gap-2 text-[0.88rem] font-medium text-foreground">
                  {passport.published ? (
                    <Eye className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {passport.published ? "Public" : "Private"}
                </p>
                <p className="mt-1 text-[0.76rem] leading-relaxed text-muted-foreground">
                  {passport.published
                    ? "Anyone with the link can view it."
                    : "Only you can see it."}
                </p>
              </div>
              <Switch
                checked={passport.published}
                onCheckedChange={togglePublished}
                aria-label="Publish passport"
              />
            </div>

            <div className="mt-5">
              <Label>Your link</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
                  <Copy />
                </Button>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-muted-foreground">
                Designed for sharing on LinkedIn, in a resume, over email, in job
                applications and through PehlaChance.
              </p>
            </div>
          </section>

          {/* ── Contents summary ─────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[0.95rem] font-semibold text-foreground">
              What you have to show
            </h2>
            <dl className="mt-4 space-y-3 text-[0.85rem]">
              <Row
                label="Career Readiness Score"
                value={`${career.readiness.score} / 100`}
              />
              <Row
                label="Badges earned"
                value={`${career.earnedBadges.length} of ${career.badges.length}`}
              />
              <Row
                label="Projects submitted"
                value={String(
                  career.projects.filter(
                    (p) => p.status === "submitted" || p.status === "evaluated",
                  ).length,
                )}
              />
              <Row
                label="Mock interviews"
                value={String(career.interviews.length)}
              />
              <Row
                label="Challenge entries"
                value={String(career.challenges.length)}
              />
              <Row
                label="Certificate"
                value={certificate ? certificate.id : "Not yet issued"}
              />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
