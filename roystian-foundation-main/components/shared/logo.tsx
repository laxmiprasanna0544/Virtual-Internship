import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Roystian Foundation emblem (public/images/brand/roystian-logo.png). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center", className)}
      aria-hidden="true"
    >
      <Image
        src="/images/brand/roystian-logo.png"
        alt=""
        width={80}
        height={80}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export function Logo({
  className,
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">
          ROYSTIAN
        </span>
        {!compact && (
          <span className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Foundation
          </span>
        )}
      </span>
      {/* Keeps the visible wordmark inside the accessible name. */}
      <span className="sr-only">home</span>
    </Link>
  );
}
