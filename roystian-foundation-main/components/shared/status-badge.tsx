import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const TONES: Record<string, Tone> = {
  // payment
  successful: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "secondary",
  // internship
  "not-started": "secondary",
  "in-progress": "default",
  completed: "success",
  certified: "success",
  // students
  active: "default",
  suspended: "destructive",
  // submissions
  submitted: "default",
  reviewed: "default",
  approved: "success",
  "needs-revision": "warning",
  // certificates
  valid: "success",
  revoked: "destructive",
  // schedule
  upcoming: "secondary",
  live: "warning",
  // leads
  new: "default",
  contacted: "secondary",
  scheduled: "warning",
  closed: "secondary",
  // communications
  sent: "success",
  queued: "warning",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = TONES[status] ?? "secondary";
  const label = status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return (
    <Badge variant={tone} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}
