import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLearningGuide, guideDownloadUrl, guideSizeLabel } from "@/data/guides";
import { cn } from "@/lib/utils";
import type { Domain } from "@/types";

/**
 * The domain's complete learning guide (PDF). The download is served only to
 * students enrolled in the domain.
 */
export function LearningGuideCard({ domain, className }: { domain: Domain; className?: string }) {
  const guide = getLearningGuide(domain.id);
  if (!guide) return null;
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Learning guide
        </h2>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{domain.name} — Domain Learning Guide</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Covers every module with explanations, worked examples, checkpoints and a practice
        assessment. PDF · {guide.pages} pages · {guideSizeLabel(guide.bytes)}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4 w-full sm:w-auto">
        <a href={guideDownloadUrl(domain.id)} download>
          <Download /> Download guide
        </a>
      </Button>
    </section>
  );
}
