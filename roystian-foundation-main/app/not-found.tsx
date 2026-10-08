import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Compass, Home, Search } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/domains", label: "Browse all 12 domains" },
  { href: "/programs", label: "Compare programmes" },
  { href: "/verify", label: "Verify a certificate" },
  { href: "/start", label: "Start an internship" },
];

export default function NotFound() {
  return (
    <SiteShell>
      <section className="section">
        <div className="container max-w-2xl text-center">
          <p className="font-mono text-sm font-semibold text-primary">404</p>
          <h1 className="h1 mt-4">This page does not exist.</h1>
          <p className="lede mx-auto mt-5 max-w-lg">
            The link may be out of date, or the address may have a typo. Here are the
            places most people are looking for.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <Home /> Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/verify">
                <Search /> Verify a certificate
              </Link>
            </Button>
          </div>

          <ul className="mx-auto mt-10 grid max-w-md gap-2 text-left">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/35"
                >
                  <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
                  {link.label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
