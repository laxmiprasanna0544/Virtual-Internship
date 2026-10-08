import type { Metadata } from "next";
import { CampusShell } from "@/components/campus/campus-shell";

export const metadata: Metadata = {
  title: { default: "Campus Dashboard", template: "%s | Roystian Campus" },
  robots: { index: false, follow: false },
};

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CampusShell>{children}</CampusShell>;
}
