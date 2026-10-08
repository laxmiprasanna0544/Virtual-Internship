"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Lock, ShieldCheck, Unlock } from "lucide-react";
import { EASE } from "@/lib/motion";

/**
 * The unlock moment.
 *
 * Locked → unlocked → earned → verifiable, played once when a student first
 * opens an issued certificate. Four short beats, no confetti: the credential
 * is the reward, and overselling it would cheapen it.
 */
export function CertificateUnlock({
  name,
  certificateId,
}: {
  name: string;
  certificateId: string;
}) {
  const reduce = useReducedMotion();
  const [stage, setStage] = React.useState(reduce ? 3 : 0);

  React.useEffect(() => {
    if (reduce) return;
    const timers = [
      window.setTimeout(() => setStage(1), 420),
      window.setTimeout(() => setStage(2), 900),
      window.setTimeout(() => setStage(3), 1400),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduce]);

  const unlocked = stage >= 1;

  return (
    <section
      className="no-print overflow-hidden rounded-2xl border border-success/30 bg-success/[0.05] p-5 sm:p-6"
      aria-live="polite"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
              unlocked ? "bg-success/15 text-success" : "bg-warning/15 text-warning-ink"
            }`}
          >
            {unlocked ? (
              <motion.span
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Unlock className="h-5 w-5" aria-hidden="true" />
              </motion.span>
            ) : (
              <Lock className="h-5 w-5" aria-hidden="true" />
            )}
            {unlocked && !reduce && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-success/50"
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                aria-hidden="true"
              />
            )}
          </span>

          <div className="min-w-0">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-2 font-display text-lg font-semibold text-success"
            >
              <Award className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
              Certificate Earned
            </motion.p>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08, ease: EASE }}
              className="mt-1 text-sm leading-relaxed text-muted-foreground"
            >
              Congratulations {name} — every completion requirement is satisfied and
              your certificate is live on the public verification page.
            </motion.p>
          </div>
        </div>

        <motion.span
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={stage >= 3 ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.45, ease: EASE }}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-success/30 bg-background px-3.5 py-2.5 sm:self-auto"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Verified
            </span>
            <span className="block truncate font-mono text-[0.72rem] text-foreground">
              {certificateId}
            </span>
          </span>
        </motion.span>
      </div>
    </section>
  );
}
