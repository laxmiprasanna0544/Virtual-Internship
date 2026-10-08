import type { Metadata } from "next";
import { PassportView } from "@/components/dashboard/passport-view";

export const metadata: Metadata = { title: "Career Passport" };

export default function PassportPage() {
  return <PassportView />;
}
