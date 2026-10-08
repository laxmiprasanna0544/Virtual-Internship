import type { Metadata } from "next";
import { ModuleView } from "@/components/dashboard/module-view";

export const metadata: Metadata = { title: "Module" };

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { moduleId } = await params;
  return <ModuleView moduleId={moduleId} />;
}
