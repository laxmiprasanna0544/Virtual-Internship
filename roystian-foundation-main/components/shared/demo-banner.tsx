"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-warning-ink",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      Demo Environment
    </span>
  );
}

export function DemoNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <span className="font-semibold text-foreground">Demo data — </span>
      {children}
    </p>
  );
}
