"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PAYMENT_SIMULATION_MS } from "@/lib/payments";
import { formatINR } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const STEPS = [
  "Contacting payment gateway",
  "Authorising transaction",
  "Confirming registration",
];

export function PaymentProcessingDialog({
  open,
  amount,
  method,
  onComplete,
}: {
  open: boolean;
  amount: number;
  method: PaymentMethod;
  onComplete: () => void;
}) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }
    const perStep = PAYMENT_SIMULATION_MS / (STEPS.length + 1);
    const timers = STEPS.map((_, index) =>
      window.setTimeout(() => setStepIndex(index + 1), perStep * (index + 1)),
    );
    const finish = window.setTimeout(
      () => onCompleteRef.current(),
      PAYMENT_SIMULATION_MS,
    );
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(finish);
    };
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent hideClose className="max-w-sm text-center">
        <DialogTitle className="sr-only">Processing payment</DialogTitle>
        <div className="flex flex-col items-center py-2">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </span>
          <p className="mt-5 font-display text-base font-semibold text-foreground">
            Securely processing your payment…
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatINR(amount)} via {method.toUpperCase()}
          </p>

          <ul
            className="mt-6 w-full space-y-2.5 text-left"
            aria-live="polite"
            aria-busy="true"
          >
            {STEPS.map((step, index) => {
              const done = index < stepIndex;
              const active = index === stepIndex;
              return (
                <li key={step} className="flex items-center gap-2.5 text-sm">
                  {done ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : active ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      done || active ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Simulated gateway — no real transaction takes place
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
