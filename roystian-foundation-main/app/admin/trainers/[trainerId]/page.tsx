import type { Metadata } from "next";
import { AdminTrainerProfile } from "@/components/admin/trainer-profile";

export const metadata: Metadata = { title: "Trainer" };

interface PageProps {
  params: Promise<{ trainerId: string }>;
}

export default async function AdminTrainerProfilePage({ params }: PageProps) {
  const { trainerId } = await params;
  return <AdminTrainerProfile trainerId={trainerId} />;
}
