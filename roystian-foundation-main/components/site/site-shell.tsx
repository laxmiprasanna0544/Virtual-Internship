import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { PageTransition } from "@/components/motion/page-transition";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  /**
   * Set on pages that open with a full-bleed hero the fixed navbar sits over.
   * Everything else reserves the navbar's height so content starts below it.
   */
  bleed = false,
}: {
  children: React.ReactNode;
  bleed?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main
        id="main"
        className={cn("flex-1", !bleed && "pt-16 lg:pt-[4.75rem]")}
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
