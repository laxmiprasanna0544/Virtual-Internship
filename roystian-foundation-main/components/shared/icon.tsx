import {
  BarChart3,
  BrainCircuit,
  Code2,
  Coffee,
  Cog,
  Compass,
  Cpu,
  FlaskConical,
  GraduationCap,
  Layers,
  Leaf,
  Megaphone,
  Presentation,
  Rocket,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  BarChart3,
  BrainCircuit,
  Code2,
  Coffee,
  Cog,
  Compass,
  Cpu,
  FlaskConical,
  GraduationCap,
  Layers,
  Leaf,
  Megaphone,
  Presentation,
  Rocket,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Users,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Layers;
}

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = getIcon(name);
  return <Icon className={className} aria-hidden="true" />;
}
