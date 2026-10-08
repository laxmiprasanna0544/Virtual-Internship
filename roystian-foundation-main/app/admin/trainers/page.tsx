import type { Metadata } from "next";
import { AdminTrainers } from "@/components/admin/trainers";

export const metadata: Metadata = { title: "Trainers" };

export default function AdminTrainersPage() {
  return <AdminTrainers />;
}
