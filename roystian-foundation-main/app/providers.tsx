"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme";

/** Keeps toast styling in step with the active colour theme. */
function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-background text-foreground shadow-lift",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        {children}
        <AppToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
