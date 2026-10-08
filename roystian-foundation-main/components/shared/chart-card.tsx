"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Frame for a chart.
 *
 * The chart itself is not mounted until the card scrolls into view: Recharts
 * plays its draw-in animation on mount, so deferring gives every chart an
 * entry animation and keeps offscreen charts off the main thread.
 */
export function ChartCard({
  title,
  description,
  children,
  action,
  /** Reserved height while the chart is still offscreen, in pixels. */
  placeholderHeight = 240,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  placeholderHeight?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 15% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn("h-full", className)}
    >
      <Card className="h-full p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
        {visible ? (
          children
        ) : (
          <div
            className="skeleton w-full"
            style={{ height: placeholderHeight }}
            aria-hidden="true"
          />
        )}
      </Card>
    </motion.div>
  );
}
