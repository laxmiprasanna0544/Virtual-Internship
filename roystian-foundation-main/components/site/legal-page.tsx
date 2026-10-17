import { SiteShell } from "@/components/site/site-shell";
import { Breadcrumbs } from "@/components/shared/page-header";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <SiteShell>
      <section className="border-b border-border bg-muted/25 py-12 lg:py-14">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
          <h1 className="h1">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
          <p className="lede mt-5 max-w-2xl">{intro}</p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <div className="space-y-10">
            {sections.map((section, index) => (
              <section key={section.heading}>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  <span className="mr-2 font-mono text-sm text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span aria-hidden="true">—</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
