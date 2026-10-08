"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/lib/images";

export interface ParallaxImageProps {
  image: ImageAsset;
  /** Override the asset's own alt text; pass "" for decorative use. */
  alt?: string;
  className?: string;
  imageClassName?: string;
  /** Vertical travel in percent of the container height. 0 disables parallax. */
  strength?: number;
  /** Extra scale so parallax travel never exposes an edge. */
  overscan?: number;
  priority?: boolean;
  sizes?: string;
  /** Rendered above the photograph — gradients, captions, badges. */
  children?: React.ReactNode;
  /** Scrim strength for text placed over the image. */
  overlay?: "none" | "soft" | "strong" | "bottom";
}

const OVERLAY_CLASS: Record<NonNullable<ParallaxImageProps["overlay"]>, string> = {
  none: "",
  soft: "bg-gradient-to-t from-ink-surface/55 via-ink-surface/20 to-transparent",
  strong: "bg-gradient-to-t from-ink-surface/85 via-ink-surface/55 to-ink-surface/25",
  bottom: "bg-gradient-to-t from-ink-surface/90 via-ink-surface/35 to-transparent",
};

/**
 * Photograph that drifts against the scroll. The transform runs on a spring
 * off `useScroll`, so there is no scroll listener doing layout work per frame.
 */
export function ParallaxImage({
  image,
  alt,
  className,
  imageClassName,
  strength = 12,
  overscan,
  priority = false,
  sizes = "100vw",
  children,
  overlay = "none",
}: ParallaxImageProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(
    scrollYProgress,
    [0, 1],
    [`${-strength}%`, `${strength}%`],
  );
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });
  const active = !reduce && strength > 0;
  const scale = overscan ?? (active ? 1 + strength / 100 + 0.04 : 1);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        style={active ? { y, scale } : undefined}
      >
        <Image
          src={image.src}
          alt={alt ?? image.alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={image.blurDataURL}
          className={cn("object-cover", imageClassName)}
          style={{ objectPosition: image.position }}
        />
      </motion.div>
      {overlay !== "none" && (
        <div
          className={cn("absolute inset-0", OVERLAY_CLASS[overlay])}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export interface StaticImageProps {
  image: ImageAsset;
  alt?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  overlay?: ParallaxImageProps["overlay"];
  children?: React.ReactNode;
}

/** Same framing as ParallaxImage, without the scroll transform. */
export function StaticImage({
  image,
  alt,
  className,
  imageClassName,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  overlay = "none",
  children,
}: StaticImageProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={image.src}
        alt={alt ?? image.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: image.position }}
      />
      {overlay !== "none" && (
        <div
          className={cn("absolute inset-0", OVERLAY_CLASS[overlay])}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
