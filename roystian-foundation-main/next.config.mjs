import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Content-Security-Policy is set per request by middleware.ts, from
// runtime configuration (uploads bucket, Cashfree environment), so the same
// image runs in every environment. These headers are environment-independent.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://sdk.cashfree.com")',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  outputFileTracingRoot: __dirname,
  // The learning-guide PDFs are read at runtime by this route; ship them in the
  // standalone server bundle (they are deliberately not in public/).
  outputFileTracingIncludes: {
    "/api/student/guides/[domainId]": ["./content/guides/*.pdf"],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    // Photography is used at a handful of deliberate widths (full-bleed,
    // half-column, card). Narrowing the set keeps the optimiser cache small.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 256, 384],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Explainer video and poster: cache for a week at the edge and in the browser,
      // so repeat views and seeks don't go back to the origin. Rename the files to
      // publish a new cut.
      {
        source: "/videos/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
