"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CARD, CodeField, FormError } from "@/components/account/confirm-email-step";
import { Button } from "@/components/ui/button";
import { enableMfa, startMfaSetup, useSession } from "@/lib/auth";
import { qrDataUrl } from "@/lib/qr";
import { homeForRole } from "@/lib/roles";

/**
 * Two-factor authentication (TOTP authenticator app).
 * Required for staff accounts; optional for students.
 */
export function SecurityView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = searchParams.get("required") === "1";
  const { ready, user, mfaEnabled } = useSession();

  const [setup, setSetup] = React.useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account/security");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className={CARD} role="status">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  const isStaff = user.role !== "student";
  const home = homeForRole(user.role);

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await startMfaSetup();
    if (!result.ok || !result.secret || !result.otpauth) {
      setError(result.error ?? "Could not start two-factor setup.");
      setBusy(false);
      return;
    }
    setSetup({ secret: result.secret, qr: await qrDataUrl(result.otpauth, { size: 220 }) });
    setBusy(false);
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await enableMfa(code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "That code is not correct.");
      return;
    }
    toast.success("Two-factor authentication is on");
    setSetup(null);
    // A full navigation, not router.push: while MFA was off, the client router
    // prefetched staff pages and cached the middleware's redirect back here.
    if (required) window.location.assign(home);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h2">Account security</h1>
        <p className="lede mt-3">Protect your account with an authenticator app.</p>
      </div>

      {required && !mfaEnabled && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-foreground"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          Staff accounts must turn on two-factor authentication before using staff tools.
        </div>
      )}

      <div className={CARD}>
        <div className="flex items-start gap-3">
          {mfaEnabled ? (
            <ShieldCheck className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Two-factor authentication
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mfaEnabled
                ? "On. You will be asked for a code from your authenticator app each time you sign in."
                : isStaff
                  ? "Off. Required for staff accounts."
                  : "Off. Recommended: it stops anyone who learns your password from signing in."}
            </p>
          </div>
        </div>

        <FormError message={error} />

        {mfaEnabled ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Enabled
            </span>
            <Button asChild variant="outline">
              {/* Plain link for the same reason as above: skip the cached redirect. */}
              <a href={home}>Continue</a>
            </Button>
          </div>
        ) : setup ? (
          <form onSubmit={verify} noValidate className="mt-6 space-y-5">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
              <li>Scan this QR code, or enter the key manually.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qr}
                alt="QR code for your authenticator app"
                width={220}
                height={220}
                className="rounded-lg border border-border"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Setup key
                </p>
                <code className="mt-1 block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-sm text-foreground">
                  {setup.secret}
                </code>
              </div>
            </div>
            <CodeField value={code} onChange={setCode} label="Code from the app" />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Verify and turn on
            </Button>
          </form>
        ) : (
          <Button className="mt-6" size="lg" onClick={begin} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Set up authenticator app
          </Button>
        )}
      </div>
    </div>
  );
}
