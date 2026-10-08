"use client";

import * as React from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  ExternalLink,
  Instagram,
  Linkedin,
  Lock,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/states";
import { CompletionChecklist } from "@/components/dashboard/completion-checklist";
import { CertificateDocument } from "@/components/dashboard/certificate-document";
import { CertificateUnlock } from "@/components/dashboard/certificate-unlock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStudentContext } from "@/lib/use-student";
import { generateCertificate } from "@/lib/certificates";

export function CertificateView() {
  const ctx = useStudentContext();
  const [origin, setOrigin] = React.useState("");
  const [shareOpen, setShareOpen] = React.useState<"linkedin" | "instagram" | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Issue the certificate as soon as every requirement is satisfied.
  React.useEffect(() => {
    if (ctx.ready && ctx.student && ctx.certificateUnlocked && !ctx.certificate) {
      const issued = generateCertificate(ctx.student);
      if (issued) {
        toast.success("Certificate issued", {
          description: `Certificate ID ${issued.id}`,
        });
      }
    }
  }, [ctx.ready, ctx.student, ctx.certificateUnlocked, ctx.certificate]);

  if (!ctx.ready) return <LoadingState label="Loading certificate" rows={3} />;

  const { certificate, certificateUnlocked, requirements, domain, student, program } = ctx;
  const verificationUrl = certificate ? `${origin}/verify/${certificate.id}` : "";

  const shareText = certificate
    ? `I have completed the ${certificate.domainName} Virtual Internship with Roystian Foundation.\n\nThe programme covered structured learning modules, module assessments, a practical activity and a final assessment.\n\nCertificate ID: ${certificate.id}\nVerify: ${verificationUrl}\n\n#RoystianFoundation #VirtualInternship #${certificate.domainName.replace(/[^a-zA-Z]/g, "")}`
    : "";

  function copyShareText() {
    navigator.clipboard
      ?.writeText(shareText)
      .then(() => toast.success("Post text copied"))
      .catch(() => toast.error("Could not copy the text"));
  }

  /* ── Locked state ───────────────────────────────────────────── */
  if (!certificateUnlocked || !certificate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Certificate"
          description="Your certificate unlocks once every completion requirement is satisfied."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Certificate" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/12 text-warning-ink">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-foreground">
              Certificate Locked
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Paying for a programme starts your internship — it does not complete it.
              Finish the requirements listed here and the certificate is issued
              automatically.
            </p>
            {program?.id === "industry-led" && (
              <p className="mt-3 max-w-sm rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Guided programme requirement:</strong> The certificate
                will be generated only after the completion of live classes, that is the duration period
                mentioned which is 15 days.
              </p>
            )}
            <Button asChild className="mt-6">
              <Link href="/dashboard/learning">Continue learning</Link>
            </Button>
          </section>

          <CompletionChecklist
            requirements={requirements}
            unlocked={certificateUnlocked}
          />
        </div>
      </div>
    );
  }

  /* ── Earned state ───────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Certificate"
          description={`Issued for the ${domain?.name} Virtual Internship. Certificate ID ${certificate.id}.`}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Certificate" },
          ]}
          action={
            <Button onClick={() => window.print()}>
              <Printer /> Print Certificate
            </Button>
          }
        />
      </div>

      <CertificateUnlock
        name={student?.name.split(" ")[0] ?? "there"}
        certificateId={certificate.id}
      />

      {/* Certificate */}
      <div className="print-sheet scrollbar-thin overflow-x-auto rounded-2xl border border-border bg-muted/40 p-3 sm:p-6">
        <div className="min-w-[640px]">
          <CertificateDocument
            certificate={certificate}
            verificationUrl={verificationUrl}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="no-print grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Certificate actions
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button onClick={() => window.print()}>
              <Download /> Download Certificate
            </Button>
            <Button variant="outline" onClick={() => setShareOpen("linkedin")}>
              <Linkedin /> Share on LinkedIn
            </Button>
            <Button variant="outline" onClick={() => setShareOpen("instagram")}>
              <Instagram /> Share on Instagram
            </Button>
            <Button asChild variant="outline">
              <Link href={`/verify/${certificate.id}`}>
                <ShieldCheck /> Verify Certificate
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            "Download" opens your browser's print dialog — choose "Save as PDF" to keep a
            copy. The certificate is laid out for A4 landscape.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Verification
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Certificate ID</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                  {certificate.id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Copy certificate ID"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(certificate.id)
                      .then(() => toast.success("Certificate ID copied"))
                      .catch(() => toast.error("Could not copy"));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Verification URL</dt>
              <dd className="mt-1 break-all text-xs text-foreground">{verificationUrl}</dd>
            </div>
          </dl>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href={`/verify/${certificate.id}`}>
              <ExternalLink /> Open public verification page
            </Link>
          </Button>
        </section>
      </div>

      {/* Share dialog */}
      <Dialog open={shareOpen !== null} onOpenChange={(open) => !open && setShareOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {shareOpen === "linkedin" ? "Share on LinkedIn" : "Share on Instagram"}
            </DialogTitle>
            <DialogDescription>
              {shareOpen === "linkedin"
                ? "Copy this post text, then attach the printed certificate image to your LinkedIn post."
                : "Copy this caption, then post the certificate image to your Instagram story or feed."}
            </DialogDescription>
          </DialogHeader>

          <label htmlFor="share-text" className="sr-only">
            Share text
          </label>
          <Textarea id="share-text" readOnly rows={9} value={shareText} />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Save certificate image
            </Button>
            <Button onClick={copyShareText}>
              <Copy /> Copy post text
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sharing is composed here and posted by you — this demo does not connect to any
            social network.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
