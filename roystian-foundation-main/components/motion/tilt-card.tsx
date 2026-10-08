"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. Kept small on purpose. */
  max?: number;
  /** Adds a light sweep that tracks the pointer. */
  shine?: boolean;
}

/**
 * Restrained pointer tilt for a single hero object (the certificate).
 * Max 6° so it reads as depth rather than a toy, and it is disabled for
 * coarse pointers and reduced-motion users.
 */
export function TiltCard({
  children,
  className,
  max = 6,
  shine = true,
}: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 150, damping: 20, mass: 0.4 };
  const rotateX = useSpring(
    useTransform(py, [0, 1], [max, -max]),
    spring,
  );
  const rotateY = useSpring(
    useTransform(px, [0, 1], [-max, max]),
    spring,
  );
  const shineX = useSpring(useTransform(px, [0, 1], ["15%", "85%"]), spring);
  const shineY = useSpring(useTransform(py, [0, 1], ["10%", "90%"]), spring);
  const shineBg = useMotionTemplate`radial-gradient(38% 55% at ${shineX} ${shineY}, hsl(0 0% 100% / 0.28), transparent 70%)`;

  React.useEffect(() => {
    if (reduce) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduce]);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={enabled ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="relative h-full w-full"
      >
        {children}
        {shine && enabled && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
            style={{ background: shineBg }}
          />
        )}
      </motion.div>
    </div>
  );
}
