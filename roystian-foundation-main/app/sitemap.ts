import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { DOMAINS } from "@/data/domains";


export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/internships", priority: 0.95 },
    { path: "/for-students", priority: 0.9 },
    { path: "/opportunities", priority: 0.85 },
    { path: "/opportunities/challenges", priority: 0.75 },
    { path: "/opportunities/fellowship", priority: 0.75 },
    { path: "/opportunities/advanced-internship", priority: 0.75 },
    { path: "/opportunities/scholarship", priority: 0.75 },
    { path: "/domains", priority: 0.9 },
    { path: "/programs", priority: 0.9 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/colleges", priority: 0.8 },
    { path: "/college-internships", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/pehlachance", priority: 0.6 },
    { path: "/verify", priority: 0.7 },
    { path: "/start", priority: 0.9 },
    { path: "/login", priority: 0.4 },
    { path: "/register", priority: 0.4 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
    { path: "/refund-policy", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...DOMAINS.map((domain) => ({
      url: `${base}/internships/${domain.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
