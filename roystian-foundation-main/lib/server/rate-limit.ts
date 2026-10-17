import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Per-instance rate limiting. Counts live in this container's memory, so the
 * effective limit is roughly `limit × running instances`. Edge protection
 * (the hosting platform's DDoS protection or a WAF) handles volumetric abuse.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

/**
 * The caller's IP, from the header your edge sets and overwrites (so clients
 * can't spoof it):
 *   DigitalOcean App Platform  CLIENT_IP_HEADER=do-connecting-ip
 *   Cloudflare                 CLIENT_IP_HEADER=cf-connecting-ip
 *   AWS CloudFront             CLIENT_IP_HEADER=cloudfront-viewer-address ("ip:port")
 * Without one, the last X-Forwarded-For hop (set by the nearest proxy) is used.
 */
export function clientIp(req: Pick<NextRequest, "headers">): string {
  const header = process.env.CLIENT_IP_HEADER?.toLowerCase();
  const trusted = header ? req.headers.get(header) : null;
  if (trusted) {
    const value = trusted.split(",")[0].trim();
    return header === "cloudfront-viewer-address" ? value.slice(0, value.lastIndexOf(":")) || value : value;
  }
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",").pop()?.trim() || "local";
}

/**
 * Returns a 429 response when `key` has made more than `limit` calls in the
 * last `windowSeconds`, otherwise null.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): NextResponse | null {
  if (process.env.RATE_LIMIT_DISABLED === "true") return null;
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= limit) return null;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
