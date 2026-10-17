"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import type { Role, Student, User } from "@/types";

/**
 * Client-side mirror of the server rules in middleware.ts. The middleware is
 * what actually protects these routes; this only avoids a flash of the wrong
 * screen while the session loads.
 */
export function RouteGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: (context: { user: User | Student; student: Student | null }) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user, student } = useSession();

  React.useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [ready, user, allow, router, pathname]);

  if (!ready || !user || !allow.includes(user.role)) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return <>{children({ user, student })}</>;
}
