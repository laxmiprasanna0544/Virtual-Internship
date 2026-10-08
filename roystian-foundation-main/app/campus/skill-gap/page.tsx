import type { Metadata } from "next";
import { SkillGapView } from "@/components/campus/skill-gap-view";

export const metadata: Metadata = { title: "Skill Gap Report" };

export default function SkillGapPage() {
  return <SkillGapView />;
}
