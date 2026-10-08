"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, BadgeCheck, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartInternshipModal } from "@/components/site/start-internship-modal";
import { Magnetic } from "@/components/motion/magnetic-button";
import { SplitHeading } from "@/components/motion/split-heading";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { IMAGES } from "@/lib/images";
import { EASE } from "@/lib/motion";

const STATS = [
  { value: 12, suffix: "", label: "Domains to choose from" },
  { value: 10, suffix: "", label: "Modules in every track" },
  { value: 70, suffix: "%", label: "To pass an assessment" },
];

/**
 * Homepage hero.
 *
 * One photograph, held at full bleed, that drifts slowly against the scroll
 * while the headline resolves word by word. Everything animated here is
 * opacity or transform, and the whole sequence is finished inside 1.6s.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [startModalOpen, setStartModalOpen] = React.useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const y = useSpring(rawY, { stiffness: 110, damping: 30, mass: 0.4 });
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  const image = IMAGES.heroStudentLearning;

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  return (
    <section
      ref={ref}
      className="surface-ink relative isolate flex min-h-[88svh] flex-col overflow-hidden"
    >
      {/* Photograph */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { y, opacity: fade }}
      >
        <motion.div
          className="relative h-[116%] w-full"
          initial={reduce ? false : { scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            className="object-cover"
            style={{ objectPosition: image.position }}
          />
        </motion.div>
      </motion.div>

      {/* Scrims: vertical for the navbar, horizontal for the copy. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-surface/80 via-ink-surface/45 to-ink-surface/92"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-surface/85 via-ink-surface/45 to-transparent"
      />

      <div className="container relative flex flex-1 flex-col justify-end pb-14 pt-32 sm:pb-16 lg:pb-20 lg:pt-40">
        <motion.p
          {...rise(0.35)}
          className="eyebrow flex items-center gap-2.5 text-white/70"
        >
          <span className="h-px w-7 bg-white/40" aria-hidden="true" />
          Student Career &amp; Industry Readiness Platform
        </motion.p>

        <SplitHeading
          as="h1"
          immediate
          delay={0.45}
          lines={["Don't just get", "an internship.", "Build career evidence."]}
          className="display mt-5 max-w-[17ch] text-white"
          accentLine={3}
          accentClassName="text-white/55"
        />

        <motion.p
          {...rise(0.95)}
          className="mt-6 font-display text-lg font-semibold tracking-tight text-white sm:text-xl"
        >
          Learn. Build. Prove. Get Opportunity.
        </motion.p>

        <motion.p
          {...rise(1)}
          className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
        >
          Structured internships, practical projects, skill assessments and career
          tools designed to help students move from academic learning toward
          practical industry readiness.
        </motion.p>

        <motion.div {...rise(1.12)} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Magnetic>
            <Button
              size="xl"
              onClick={() => setStartModalOpen(true)}
              className="group w-full sm:w-auto sm:px-8 bg-white text-ink-surface hover:bg-white/90"
            >
              Start My Internship
              <ArrowRight className="cta-arrow" />
            </Button>
          </Magnetic>
          <Button
            asChild
            size="xl"
            variant="outline"
            className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
          >
            <Link href="/internships">Explore Programs</Link>
          </Button>
        </motion.div>

        <motion.dl
          {...rise(1.25)}
          className="mt-12 grid max-w-2xl grid-cols-3 gap-5 border-t border-white/15 pt-6 sm:gap-8"
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-2xl font-semibold text-white sm:text-3xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="mt-1 text-[0.72rem] leading-snug text-white/60 sm:text-xs">
                {stat.label}
              </dt>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* Floating proof card — the outcome of the whole journey, up front. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.35, ease: EASE }}
        className="pointer-events-none absolute bottom-20 right-8 hidden w-[16.5rem] rounded-2xl border border-white/15 bg-ink-surface/70 p-4 shadow-lift backdrop-blur-md xl:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20 text-success">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.8rem] font-semibold text-white">
              Certificate verified
            </p>
            <p className="truncate font-mono text-[0.68rem] text-white/55">
              RF-AIML-2026-000184
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-white/10 pt-3 text-[0.7rem] leading-relaxed text-white/55">
          Every certificate resolves to a public verification page. Demo record.
        </p>
      </motion.div>

      <motion.a
        href="#journey"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6, ease: EASE }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-white/65 transition-colors hover:border-white/40 hover:text-white lg:inline-flex"
      >
        <MoveDown className="h-3 w-3" aria-hidden="true" />
        Scroll
      </motion.a>

      <StartInternshipModal open={startModalOpen} onOpenChange={setStartModalOpen} />
    </section>
  );
}
