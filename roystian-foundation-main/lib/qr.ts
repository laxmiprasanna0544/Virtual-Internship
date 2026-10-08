"use client";

import QRCode from "qrcode";

/**
 * QR generation is wrapped so the rest of the app never talks to the library
 * directly. A production build could swap this for a hosted service without
 * touching any component.
 */
export async function qrDataUrl(
  value: string,
  options?: { size?: number; dark?: string; light?: string },
): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: options?.size ?? 240,
    color: {
      dark: options?.dark ?? "#0f172a",
      light: options?.light ?? "#ffffff",
    },
  });
}
