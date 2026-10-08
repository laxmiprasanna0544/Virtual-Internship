"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock,
  Loader2,
  SearchX,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/shared/qr-code";
import { VerifyWidget } from "@/components/site/verify-widget";
import { verifyCertificate, type VerificationResult } from "@/lib/certificates";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getProgram } from "@/data/programs";
import { EASE, STAGGER } from "@/lib/motion";

export function VerificationResultView({ certificateId }: { certificateId: string }) {
  const reduce = useReducedMotion();
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
    const timer = window.setTimeout(() => {
      setResult(verifyCertificate(certificateId));
      setCheckedAt(new Date().toISOString());
    }, 550);
    return () => window.clearTimeout(timer);
  }, [certificateId]);

  if (!result) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-soft"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">
          Checking certificate <span className="font-mono">{certificateId}</span>…
        </p>
      </div>
    );
  }

  if (result.status === "not-found") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-card p-7 shadow-soft sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <SearchX className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Certificate Not Found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The certificate ID you entered could not be verified. Check the ID for typing
          errors — it should look like{" "}
          <span className="font-mono text-foreground">RF-AIML-2026-000184</span>.
        </p>
        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-2.5 font-mono text-sm text-foreground">
          {certificateId}
        </p>
        <div className="mt-6 max-w-md">
          <VerifyWidget />
        </div>
      </div>
    );
  }

  const { certificate } = result;
  const revoked = result.status === "revoked";
  const program = getProgram(certificate.programId);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={`rounded-2xl border bg-card p-7 shadow-card sm:p-9 ${
        revoked ? "border-destructive/35" : "border-success/35"
      }`}
      aria-live="polite"
    >
      <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <motion.span
            initial={reduce ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
              revoked
                ? "bg-destructive/10 text-destructive"
                : "bg-success/12 text-success"
            }`}
          >
            {revoked ? (
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            ) : (
              <BadgeCheck className="h-6 w-6" aria-hidden="true" />
            )}
            {!revoked && !reduce && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-success/50"
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
                aria-hidden="true"
              />
            )}
          </motion.span>

          <h1
            className={`mt-5 font-display text-2xl font-semibold ${
              revoked ? "text-destructive" : "text-success"
            }`}
          >
            {revoked ? "Certificate Revoked" : "Certificate Verified"}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {revoked
              ? "This certificate was issued by Roystian Foundation but has since been revoked. It should not be treated as a valid credential."
              : "This certificate was issued by Roystian Foundation and is currently valid."}
          </p>

          <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Student", value: certificate.studentName },
              {
                label: "Program",
                value: `${certificate.domainName} Virtual Internship`,
              },
              { label: "Domain", value: certificate.domainName },
              { label: "Program type", value: program?.name ?? certificate.programName },
              { label: "Duration", value: certificate.duration },
              { label: "Issued By", value: "Roystian Foundation" },
              { label: "Certificate ID", value: certificate.id, mono: true },
              { label: "Issue Date", value: formatDate(certificate.issueDate) },
            ].map((row, index) => (
              <motion.div
                key={row.label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.25 + index * STAGGER.tight,
                  ease: EASE,
                }}
                className="border-b border-border pb-3.5"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {row.label}
                </dt>
                <dd
                  className={`mt-1 text-sm font-medium text-foreground ${
                    row.mono ? "font-mono" : ""
                  }`}
                >
                  {row.value}
                </dd>
              </motion.div>
            ))}
          </dl>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Verification timestamp: {formatDateTime(checkedAt)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-5">
          <QRCode value={`${origin}/verify/${certificate.id}`} size={148} />
          <p className="max-w-[10rem] text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            Scan to open this verification page
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <Button asChild variant="outline">
          <Link href="/verify">Verify another certificate</Link>
        </Button>
        <Button asChild>
          <Link href="/start">
            Start your own internship <ArrowRight />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
