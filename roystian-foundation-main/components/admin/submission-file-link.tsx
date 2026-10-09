"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submissionFileUrl } from "@/lib/admin-data";

/** Opens a student's uploaded file through a short-lived signed link. */
export function SubmissionFileLink({
  filePath,
  fileName,
}: {
  filePath: string | null | undefined;
  fileName: string | null;
}) {
  const [opening, setOpening] = React.useState(false);
  if (!fileName) return null;

  if (!filePath) {
    return <p className="truncate font-mono text-xs text-muted-foreground">{fileName}</p>;
  }

  async function open() {
    setOpening(true);
    try {
      const url = await submissionFileUrl(filePath!);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the file.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto max-w-full justify-start gap-1.5 p-0 font-mono text-xs"
      onClick={open}
      disabled={opening}
    >
      {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      <span className="truncate">{fileName}</span>
    </Button>
  );
}
