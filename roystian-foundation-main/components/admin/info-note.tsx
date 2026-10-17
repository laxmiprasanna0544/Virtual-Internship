import { cn } from "@/lib/utils";

/** A neutral explanatory note for staff screens. */
export function InfoNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
