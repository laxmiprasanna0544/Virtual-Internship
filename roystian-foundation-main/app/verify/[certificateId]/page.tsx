import type { Metadata } from "next";
import { SiteShell } from "@/components/site/site-shell";
import { Breadcrumbs } from "@/components/shared/page-header";
import { VerificationResultView } from "@/components/site/verification-result";

interface PageProps {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certificateId } = await params;
  const id = decodeURIComponent(certificateId).toUpperCase();
  return {
    title: `Verify ${id}`,
    description: `Public verification page for Roystian Foundation certificate ${id}.`,
    robots: { index: false, follow: true },
  };
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { certificateId } = await params;
  const id = decodeURIComponent(certificateId).toUpperCase();

  return (
    <SiteShell>
      <section className="border-b border-border bg-muted/30 py-8">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Verify Certificate", href: "/verify" },
              { label: id },
            ]}
          />
          <h1 className="sr-only">Certificate verification for {id}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{id}</p>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container max-w-4xl">
          <VerificationResultView certificateId={id} />
        </div>
      </section>
    </SiteShell>
  );
}
