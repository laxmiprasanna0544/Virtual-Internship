/**
 * Content Security Policy, built per request from runtime configuration so
 * one Docker image works in every environment (the uploads bucket and the
 * Cashfree environment differ between them).
 */

const CASHFREE_ORIGINS = [
  "https://sdk.cashfree.com",
  "https://api.cashfree.com",
  "https://sandbox.cashfree.com",
];

function origin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Where the browser uploads to and downloads from (presigned S3 URLs). */
export function uploadsOrigin(): string | null {
  const explicit = origin(process.env.S3_PUBLIC_ENDPOINT);
  if (explicit) return explicit;
  const bucket = process.env.S3_UPLOADS_BUCKET;
  if (!bucket) return null;
  const endpoint = origin(process.env.S3_ENDPOINT);
  if (endpoint) {
    if (process.env.S3_FORCE_PATH_STYLE === "true") return endpoint;
    const url = new URL(endpoint);
    return `${url.protocol}//${bucket}.${url.host}`;
  }
  const region = process.env.S3_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const uploads = uploadsOrigin();
  // A local Cashfree mock (development and automated tests only).
  const cashfreeMock = origin(process.env.CASHFREE_API_BASE);
  const cashfree = [...CASHFREE_ORIGINS, ...(cashfreeMock ? [cashfreeMock] : [])].join(" ");
  const upgrade = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

  return [
    "default-src 'self'",
    // Next.js injects inline bootstrap scripts; dev mode also needs eval.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://sdk.cashfree.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${uploads ? ` ${uploads}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${uploads ? ` ${uploads}` : ""} ${cashfree}`,
    `frame-src ${cashfree}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self' ${cashfree}${uploads ? ` ${uploads}` : ""}`,
    ...(upgrade ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
