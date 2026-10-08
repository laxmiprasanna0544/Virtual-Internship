import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DynamicIcon } from "@/components/shared/icon";
import { Badge } from "@/components/ui/badge";
import { domainImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { EXPERIENCE_LEVELS } from "@/data/content";
import type { Domain } from "@/types";

export function DomainCard({
  domain,
  className,
  priority = false,
}: {
  domain: Domain;
  className?: string;
  priority?: boolean;
}) {
  const levels = domain.levels
    .map(
      (level) =>
        EXPERIENCE_LEVELS.find((e) => e.value === level)?.label.split(" / ")[0] ??
        level,
    )
    .join(" · ");
  const image = domainImage(domain.id);

  return (
    <article
      className={cn(
        "lift-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
        className,
      )}
    >
      <Link
        href={`/internships/${domain.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`View the ${domain.name} internship`}
      />

      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={image.src}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          placeholder="blur"
          blurDataURL={image.blurDataURL}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          style={{ objectPosition: image.position }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink-surface/70 via-ink-surface/10 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-0.5">
            <DynamicIcon name={domain.icon} className="h-[1.1rem] w-[1.1rem]" />
          </span>
          <Badge
            variant="secondary"
            className="border-white/20 bg-white/10 text-white backdrop-blur-sm"
          >
            {domain.category}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
          {domain.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {domain.description}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
          <div>
            <dt className="text-muted-foreground">Modules</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {domain.modules.length} modules
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Levels</dt>
            <dd className="mt-0.5 font-semibold text-foreground">{levels}</dd>
          </div>
        </dl>

        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          View Internship
          <ArrowRight className="h-4 w-4 cta-arrow" aria-hidden="true" />
        </p>
      </div>
    </article>
  );
}
