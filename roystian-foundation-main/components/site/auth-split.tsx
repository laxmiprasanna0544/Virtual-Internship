import { StaticImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import type { ImageAsset } from "@/lib/images";

/**
 * Two-column frame for the auth pages: the form on the left, one photograph
 * holding the right. The image is decorative and never blocks the form on
 * narrow screens, where it simply does not render.
 */
export function AuthSplit({
  image,
  caption,
  points,
  children,
}: {
  image: ImageAsset;
  caption: string;
  points?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
      <div className="min-w-0">{children}</div>

      <aside className="hidden lg:block">
        <Reveal preset="imageReveal" className="sticky top-28">
          <StaticImage
            image={image}
            alt=""
            sizes="(min-width: 1024px) 38vw, 0px"
            className="mask-arch-r aspect-[4/5] w-full border border-border"
            overlay="bottom"
          >
            <p className="absolute inset-x-0 bottom-0 max-w-sm p-6 font-display text-lg font-semibold leading-snug text-white">
              {caption}
            </p>
          </StaticImage>
          {points && points.length > 0 && (
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {points.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <span className="text-primary" aria-hidden="true">
                    —
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </aside>
    </div>
  );
}
