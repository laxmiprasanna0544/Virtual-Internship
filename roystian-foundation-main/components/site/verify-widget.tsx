"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyWidget({
  compact = false,
  autoFocus = false,
}: {
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const id = value.trim().toUpperCase();
    if (!id) {
      setError("Enter a certificate ID to verify.");
      return;
    }
    setError(null);
    router.push(`/verify/${encodeURIComponent(id)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      {!compact && (
        <Label htmlFor="certificate-id" className="mb-2 block">
          Certificate ID
        </Label>
      )}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Input
          id="certificate-id"
          name="certificateId"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          placeholder="RF-AIML-2026-000184"
          className="font-mono uppercase placeholder:font-mono placeholder:normal-case"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "certificate-id-error" : undefined}
        />
        <Button type="submit" size="default" className="h-11 shrink-0 sm:px-6">
          <Search /> Verify
        </Button>
      </div>
      {error && (
        <p id="certificate-id-error" role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {!compact && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Try a demo certificate:{" "}
          <button
            type="button"
            className="font-mono text-primary underline-offset-2 hover:underline"
            onClick={() => setValue("RF-AIML-2026-000184")}
          >
            RF-AIML-2026-000184
          </button>
        </p>
      )}
    </form>
  );
}
