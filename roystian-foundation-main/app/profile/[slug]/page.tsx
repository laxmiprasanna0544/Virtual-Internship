import type { Metadata } from "next";
import { PublicProfile } from "@/components/site/public-profile";

export const metadata: Metadata = {
  title: "Career Passport",
  description:
    "A verified record of skills, projects and assessed outcomes built through Roystian Foundation.",
  // Profiles are shared deliberately by the student, not surfaced by search.
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfile slug={slug} />;
}
