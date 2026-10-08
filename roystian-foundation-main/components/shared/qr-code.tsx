"use client";

import * as React from "react";
import { qrDataUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";

export function QRCode({
  value,
  size = 160,
  className,
  alt = "QR code",
}: {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!value) return;
    qrDataUrl(value, { size: size * 2 })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-lg bg-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} width={size} height={size} className="h-full w-full" />
      ) : (
        <span className="skeleton h-full w-full" aria-hidden="true" />
      )}
    </span>
  );
}
