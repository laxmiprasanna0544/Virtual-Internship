"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Progress bar.
 *
 * Every bar starts empty and fills to its real value on the first frame after
 * mount, so progress always reads as something that was earned rather than a
 * number that was always there. Reduced-motion users get the final value
 * immediately.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
    /** Skip the fill-from-zero animation (e.g. inside a live-updating list). */
    instant?: boolean;
  }
>(({ className, value, indicatorClassName, instant = false, ...props }, ref) => {
  const reduce = useReducedMotion();
  const [filled, setFilled] = React.useState(false);

  React.useEffect(() => {
    if (instant || reduce) {
      setFilled(true);
      return;
    }
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, [instant, reduce]);

  const shown = filled ? value || 0 : 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 rounded-full bg-primary transition-transform duration-700 ease-out",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - shown}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
