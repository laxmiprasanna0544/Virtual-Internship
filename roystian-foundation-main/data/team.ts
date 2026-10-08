import { IMAGES, type ImageAsset } from "@/lib/images";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: ImageAsset;
}

/**
 * The people behind the Foundation, ordered by responsibility.
 *
 * Bios are reproduced from the copy supplied by the team — these are real
 * colleagues, so nothing here is embellished or inferred. Source photographs
 * and bio text live in about-us/, one pair per person, named after them.
 */
export const TEAM: TeamMember[] = [
  {
    name: "Kiran Bavikatti",
    role: "Founder & CEO",
    bio: "Leads Roystian Foundation's vision, strategic initiatives, and innovation-driven programs across people, opportunities, technology, and social impact. Focused on building scalable solutions that create meaningful opportunities and long-term community impact.",
    image: IMAGES.teamKiranBavikatti,
  },
  {
    name: "Tejasree Akula",
    role: "Managing Director",
    bio: "Leads the Foundation's strategic direction, operations, and organizational growth. Focused on building impactful initiatives, strengthening partnerships, and turning Roystian Foundation's vision into meaningful action.",
    image: IMAGES.teamTejasreeAkula,
  },
  {
    name: "Lakshmikanth Raju Makka",
    role: "Growth & Revenue Head",
    bio: "Drives growth, partnerships, and revenue initiatives across Roystian Foundation's programs. Focused on building strategic relationships and expanding the Foundation's reach and impact.",
    image: IMAGES.teamLakshmikanthRajuMakka,
  },
  {
    name: "P. Sairamreddy",
    role: "Software & College Partnerships Lead",
    bio: "A skilled software professional with strong expertise in technology, product development, and digital solutions. He also plays a key role in building and managing college partnerships, connecting our platforms with institutions and creating opportunities for students.",
    image: IMAGES.teamPSairamreddy,
  },
  {
    name: "Arepalli Chandrakanth",
    role: "Software Professional – Backend Development",
    bio: "Responsible for designing and developing the backend systems that power Roystian Foundation's digital initiatives. Focused on building reliable, scalable solutions and supporting the technical infrastructure behind the Foundation's platforms and programs.",
    image: IMAGES.teamArepalliChandrakanth,
  },
  {
    name: "Laxmiprasanna Pathuri",
    role: "AI/ML Engineer",
    bio: "Specializes in Artificial Intelligence and Machine Learning, contributing to intelligent solutions, data-driven systems, and innovative technology initiatives at Roystian Foundation.",
    image: IMAGES.teamLaxmiprasannaPathuri,
  },
  {
    name: "Asmitha Enugala",
    role: "Operations, Growth & Revenue Associate",
    bio: "Supports operational execution, growth initiatives, and revenue development across Roystian Foundation's programs. Focused on strengthening partnerships, managing opportunities, and contributing to the Foundation's expansion and impact.",
    image: IMAGES.teamAsmithaEnugala,
  },
  {
    name: "Sushmaja Intha",
    role: "Operations, Growth & Revenue Associate",
    bio: "Supports operational execution, growth initiatives, and revenue development across Roystian Foundation's programs. Focused on building partnerships, managing opportunities, and contributing to the Foundation's growth and social impact.",
    image: IMAGES.teamSushmajaIntha,
  },
];
