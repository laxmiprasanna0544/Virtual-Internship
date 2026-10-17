import type { Metadata } from "next";
import { BadgeCheck, QrCode, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { PageHero } from "@/components/site/page-hero";
import { VerifyWidget } from "@/components/site/verify-widget";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { StaticImage } from "@/components/motion/parallax-image";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Verify Certificate",
  description:
    "Check the validity of a Roystian Foundation internship certificate using its certificate ID. No login required.",
};

export default function VerifyPage() {
  return (
    <SiteShell bleed>
      <PageHero
        image={IMAGES.certificateVerification}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Verify Certificate" }]}
        eyebrow="Certificate Verification"
        title={["Verify a", "Roystian certificate."]}
        description="Enter the certificate ID printed on the document, or scan its QR code. This page is public — no account is required."
      />

      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Enter certificate ID
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                IDs follow the format RF-DOMAIN-YEAR-SEQUENCE.
              </p>
              <div className="mt-6">
                <VerifyWidget autoFocus />
              </div>

            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <StaticImage
              image={IMAGES.certificateAchievement}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="mb-5 aspect-[16/10] w-full rounded-2xl border border-border"
            />
            <Stagger className="space-y-5">
              {[
                {
                  icon: ShieldCheck,
                  title: "What verification shows",
                  body: "The student name, domain, programme type, duration, issue date and current status of the certificate.",
                },
                {
                  icon: BadgeCheck,
                  title: "Revoked certificates",
                  body: "If a certificate has been revoked, this page reports it as revoked rather than valid.",
                },
                {
                  icon: QrCode,
                  title: "QR codes",
                  body: "Each certificate carries a QR code that resolves to its own verification page on the live site.",
                },
              ].map((item) => (
                <Reveal key={item.title} child>
                  <div className="lift-card rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
