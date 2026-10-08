import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  tone = "default",
  animate = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  /** `invert` is for headings sitting on a photograph or the ink surface. */
  tone?: "default" | "invert";
  /** Wrap in its own scroll reveal. Leave off when already inside a <Reveal>. */
  animate?: boolean;
}) {
  const invert = tone === "invert";

  const body = (
    <>
      {eyebrow && (
        <p
          className={cn(
            "eyebrow mb-3 flex items-center gap-2.5",
            align === "center" && "justify-center",
            invert && "text-white/70",
          )}
        >
          <span
            className={cn(
              "h-px w-6",
              invert ? "bg-white/40" : "bg-primary/40",
              align === "center" && "hidden sm:inline-block",
            )}
            aria-hidden="true"
          />
          {eyebrow}
        </p>
      )}
      <h2 className={cn("h2 text-balance", invert && "text-white")}>{title}</h2>
      {description && (
        <p className={cn("lede mt-4", invert && "text-white/75")}>{description}</p>
      )}
    </>
  );

  const classes = cn(
    "max-w-2xl",
    align === "center" && "mx-auto text-center",
    className,
  );

  if (!animate) return <div className={classes}>{body}</div>;

  return <Reveal className={classes}>{body}</Reveal>;
}

/**
 * Small numbered label used to mark the stages of the student narrative
 * (discover → choose → learn → practise → assess → certify → move forward).
 */
export function StepMarker({
  index,
  total,
  label,
  tone = "default",
  className,
}: {
  index: number;
  total: number;
  label: string;
  tone?: "default" | "invert";
  className?: string;
}) {
  const invert = tone === "invert";
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em]",
        invert ? "text-white/60" : "text-muted-foreground",
        className,
      )}
    >
      <span className={invert ? "text-white" : "text-primary"}>{label}</span>
      <span
        className={cn("h-px w-8", invert ? "bg-white/25" : "bg-border")}
        aria-hidden="true"
      />
      <span className="opacity-60">
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </p>
  );
}
