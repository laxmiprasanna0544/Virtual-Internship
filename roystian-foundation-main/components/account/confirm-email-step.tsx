"use client";

import * as React from "react";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmSignup, resendConfirmationCode } from "@/lib/auth";

export const CARD = "rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8";

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

/** A single 6-digit code field, shared by every code step. */
export function CodeField({
  id = "code",
  value,
  onChange,
  label = "6-digit code",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        placeholder="123456"
        className="tracking-[0.4em]"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      />
    </div>
  );
}

/**
 * "Enter the code we emailed you" after sign-up. Calls `onConfirmed` once
 * The server accepts the code, so the caller can sign the user straight in.
 */
export function ConfirmEmailStep({
  email,
  onConfirmed,
}: {
  email: string;
  onConfirmed: () => Promise<void> | void;
}) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await confirmSignup(email, code);
    if (!result.ok) {
      setError(result.error ?? "That code is not correct.");
      setBusy(false);
      return;
    }
    await onConfirmed();
    setBusy(false);
  }

  async function resend() {
    await resendConfirmationCode(email);
    toast.success("A new code is on its way.");
  }

  return (
    <form onSubmit={submit} noValidate className={CARD}>
      <MailCheck className="h-6 w-6 text-primary" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-semibold text-foreground">Confirm your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the 6-digit code we emailed to{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>
      <FormError message={error} />
      <div className="mt-6">
        <CodeField value={code} onChange={setCode} />
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <MailCheck />} Confirm email
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        No email?{" "}
        <button type="button" onClick={resend} className="font-medium text-primary hover:underline">
          Send a new code
        </button>
      </p>
    </form>
  );
}
