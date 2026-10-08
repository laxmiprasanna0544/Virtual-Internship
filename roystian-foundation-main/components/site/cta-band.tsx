import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic-button";
import { Button } from "@/components/ui/button";
import { heroOutlineButton } from "@/components/site/page-hero";
import type { ImageAsset } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Closing call to action. One photograph, one statement, two routes forward —
 * used at the foot of every marketing page so the site ends the same way.
 */
export function CtaBand({
  image,
  title,
  description,
  primary,
  secondary,
  note,
  className,
}: {
  image: ImageAsset;
  title: string[];
  description?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  note?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "surface-ink relative isolate flex min-h-[56svh] items-center overflow-hidden",
        className,
      )}
    >
      <ParallaxImage
        image={image}
        alt=""
        strength={12}
        sizes="100vw"
        className="absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-surface/95 via-ink-surface/88 to-ink-surface/72"
      />

      <div className="container relative py-20 text-center lg:py-24">
        <SplitHeading
          lines={title}
          className="display-sm mx-auto max-w-[20ch] text-white"
          accentLine={title.length - 1}
          accentClassName="text-white/55"
        />
        {description && (
          <Reveal delay={0.12}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75">
              {description}
            </p>
          </Reveal>
        )}
        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Magnetic>
              <Button asChild size="xl" className="group w-full sm:w-auto sm:px-8">
                <Link href={primary.href}>
                  {primary.label} <ArrowRight className="cta-arrow" />
                </Link>
              </Button>
            </Magnetic>
            {secondary && (
              <Button asChild size="xl" variant="outline" className={heroOutlineButton}>
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
          {note && (
            <p className="mx-auto mt-7 max-w-md text-xs leading-relaxed text-white/70">
              {note}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
