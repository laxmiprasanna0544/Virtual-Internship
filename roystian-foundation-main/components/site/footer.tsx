import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SITE } from "@/data/content";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Students",
    links: [
      { label: "Start Internship", href: "/start" },
      { label: "Programs", href: "/programs" },
      { label: "Domains", href: "/domains" },
      { label: "Certificate Verification", href: "/verify" },
    ],
  },
  {
    title: "Colleges",
    links: [
      { label: "Partner With Us", href: "/colleges" },
      { label: "College Internship Program", href: "/college-internships" },
      { label: "Workshops", href: "/colleges#workshops" },
    ],
  },
  {
    title: "Organizations",
    links: [{ label: "Collaborate With Us", href: "/colleges#collaborate" }],
  },
  {
    title: "About",
    links: [
      { label: "Our Mission", href: "/about" },
      { label: "Research & Innovation", href: "/about#research-innovation" },
      { label: "Career Development", href: "/about#career-development" },
      { label: "Community Impact", href: "/about#community-impact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_3fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {SITE.product}
            </p>
            <p className="mt-3 font-display text-base font-semibold tracking-[-0.01em] text-foreground">
              {SITE.tagline}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <a
                href={`mailto:${SITE.email}`}
                className="link-underline text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {SITE.email}
              </a>
              <div className="flex flex-col gap-2">
                {SITE.phones.map((phone) => (
                  <a
                    key={phone.tel}
                    href={`tel:${phone.tel}`}
                    className="link-underline w-fit text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {phone.display}
                  </a>
                ))}
              </div>
              <address className="flex gap-1.5 not-italic text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {SITE.address.line1}, {SITE.address.line2}
                  <br />
                  {SITE.address.city}, {SITE.address.state}{" "}
                  {SITE.address.postalCode}
                </span>
              </address>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                {/* h2, not h3: these are the footer's own top-level groups, and
                    a page whose last heading is the h1 must not jump to h3. */}
                <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-foreground">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-start gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight
                          className="mt-0.5 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. A Section 8 non-profit
            organization.
          </p>
          <p className="max-w-xl sm:text-right">
            Certificates are earned by completing the programme, not purchased. No
            placement is guaranteed.
          </p>
        </div>
      </div>
    </footer>
  );
}
