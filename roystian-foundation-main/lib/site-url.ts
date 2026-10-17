/**
 * The canonical site origin for metadata, robots and the sitemap. Production
 * builds must set NEXT_PUBLIC_SITE_URL (it is inlined at build time); the
 * localhost fallback only keeps local builds working and is logged loudly.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    console.warn("NEXT_PUBLIC_SITE_URL is not set: metadata, robots.txt and sitemap.xml will point at localhost.");
  }
  return "http://localhost:3000";
}
