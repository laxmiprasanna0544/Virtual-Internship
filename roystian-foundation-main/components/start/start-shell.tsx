import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { OnboardingStepper } from "@/components/start/stepper";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal } from "@/components/motion/reveal";
import { StaticImage } from "@/components/motion/parallax-image";
import { IMAGES } from "@/lib/images";
import { ONBOARDING_STEPS } from "@/data/onboarding-steps";

/**
 * Chrome for the six onboarding steps.
 *
 * The stepper is pinned under the navbar so the reader always knows how much
 * is left, and a single photograph sits alongside on wide screens — enough to
 * keep the flow feeling like part of the site without competing with the form.
 */
export function StartShell({
  step,
  title,
  description,
  backHref,
  backLabel,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const total = ONBOARDING_STEPS.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1 pt-16 lg:pt-[4.75rem]">
        <div className="sticky top-16 z-30 border-b border-border bg-background/90 py-4 backdrop-blur-xl lg:top-[4.75rem]">
          <div className="container max-w-5xl">
            <OnboardingStepper current={step} />
          </div>
        </div>

        <PageTransition>
          <div className="container max-w-5xl py-10 lg:py-14">
            {backHref && (
              <Link
                href={backHref}
                className="group mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft
                  className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                {backLabel ?? "Back"}
              </Link>
            )}

            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-14">
              <div className="min-w-0">
                <Reveal>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="text-primary">Step {step}</span>
                    <span className="mx-2 opacity-50">/</span>
                    {total}
                  </p>
                  <h1 className="h2 mt-3">{title}</h1>
                  {description && (
                    <p className="lede mt-3 max-w-2xl">{description}</p>
                  )}
                </Reveal>
                <div className="mt-9">{children}</div>
              </div>

              {/* Quiet reassurance panel — desktop only, never in the way. */}
              <aside className="hidden xl:block">
                <div className="sticky top-40">
                  <StaticImage
                    image={IMAGES.studentDashboard}
                    sizes="17rem"
                    className="aspect-[4/5] w-full rounded-2xl border border-border"
                    overlay="bottom"
                  >
                    <p className="absolute inset-x-0 bottom-0 p-4 text-[0.8rem] font-medium leading-snug text-white">
                      Your dashboard activates as soon as registration completes.
                    </p>
                  </StaticImage>
                  <ul className="mt-5 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                    <li>You can change your domain and level before checkout.</li>
                    <li>Payments in this environment are simulated.</li>
                    <li>
                      The certificate unlocks only after the completion requirements
                      are met.
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
