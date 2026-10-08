"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, QrCode, ShieldCheck } from "lucide-react";
import { TiltCard } from "@/components/motion/tilt-card";
import { IMAGES } from "@/lib/images";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Marketing preview of the completion certificate.
 *
 * A real photograph of the document, held in a tilt card so it reads as a
 * physical object. The data on it matches the seeded demo record shown on the
 * public verification page.
 */
export function CertificatePreview({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const image = IMAGES.certificateAchievement;

  return (
    <TiltCard className={cn("w-full", className)}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
      >
        <div className="relative aspect-[16/10]">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 46vw, 100vw"
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            className="object-cover"
            style={{ objectPosition: image.position }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink-surface/70 via-transparent to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success">
              <BadgeCheck className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.82rem] font-semibold text-foreground">
                Internship Completion Certificate
              </p>
              <p className="mt-0.5 truncate font-mono text-[0.7rem] text-muted-foreground">
                RF-AIML-2026-000184
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-[0.7rem]">
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" /> QR verified
            </span>
            <span className="inline-flex items-center gap-1.5 text-[0.7rem]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Public record
            </span>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}
