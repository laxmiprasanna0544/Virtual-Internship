import { rawDomains } from "./curriculum";
import { seededInt } from "@/lib/random";
import type { RawDomain, RawModule } from "./curriculum";
import type {
  AssessmentInfo,
  Concept,
  Domain,
  DomainCluster,
  Module,
  Resource,
} from "@/types";
import { careerDataFor, CLUSTER_OF, CLUSTERS } from "@/data/career-pathways";

export const PASSING_SCORE = 70;

function parseConcepts(raw: string[]): Concept[] {
  return raw.map((entry) => {
    const [term, ...rest] = entry.split("|");
    return { term: term.trim(), definition: rest.join("|").trim() };
  });
}

const RESOURCE_PLAN: { type: Resource["type"]; label: string; meta: string }[] =
  [
    { type: "pdf", label: "Module handbook", meta: "PDF · Demo resource" },
    {
      type: "checklist",
      label: "Concept checklist",
      meta: "Checklist · Demo resource",
    },
    {
      type: "template",
      label: "Practice worksheet",
      meta: "Template · Demo resource",
    },
    { type: "article", label: "Further reading", meta: "Article · Demo resource" },
    { type: "dataset", label: "Sample dataset", meta: "CSV · Demo resource" },
    {
      type: "notebook",
      label: "Walkthrough notebook",
      meta: "Notebook · Demo resource",
    },
  ];

function buildResources(module: RawModule, domain: RawDomain, index: number): Resource[] {
  const offset = index % 3;
  return [0, 1, 2].map((i) => {
    const plan = RESOURCE_PLAN[(offset + i * 2) % RESOURCE_PLAN.length];
    return {
      title: `${module.t} — ${plan.label}`,
      type: plan.type,
      meta: `${plan.meta} · ${domain.shortName}`,
    };
  });
}

function buildReading(module: RawModule, concepts: Concept[]) {
  return [
    { heading: "Module overview", body: module.s },
    {
      heading: "What you should be able to do",
      body: `By the end of this module you should be able to ${module.o
        .map((objective) => objective.charAt(0).toLowerCase() + objective.slice(1))
        .join("; ")}.`,
    },
    ...concepts.map((concept) => ({
      heading: concept.term,
      body: concept.definition,
    })),
    {
      heading: "How this module is assessed",
      body: `The module assessment checks that you can tell these concepts apart and apply them to a short scenario. You need ${PASSING_SCORE}% to pass, and you can retake the assessment as many times as you need.`,
    },
  ];
}

function buildDomain(raw: RawDomain): Domain {
  const definitionPool: Concept[] = raw.modules.flatMap((m) => parseConcepts(m.c));

  const modules: Module[] = raw.modules.map((rawModule, index) => {
    const moduleId = `${raw.id}-m${String(index + 1).padStart(2, "0")}`;
    const concepts = parseConcepts(rawModule.c);
    return {
      id: moduleId,
      domainId: raw.id,
      number: index + 1,
      title: rawModule.t,
      summary: rawModule.s,
      durationMinutes: seededInt(`${moduleId}-duration`, 35, 60),
      readMinutes: seededInt(`${moduleId}-read`, 8, 16),
      objectives: rawModule.o,
      concepts,
      reading: buildReading(rawModule, concepts),
      resources: buildResources(rawModule, raw, index),
      assessmentId: `${moduleId}-assessment`,
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.shortName,
    code: raw.code,
    icon: raw.icon,
    tagline: raw.tagline,
    description: raw.description,
    longDescription: raw.longDescription,
    category: raw.category,
    cluster: CLUSTER_OF[raw.category] ?? "Technology",
    whoFor: raw.whoFor,
    whatYouLearn: raw.whatYouLearn,
    whatYouPractise: careerDataFor(raw.id).practise,
    careerPathways: careerDataFor(raw.id).pathways,
    levels: raw.levels,
    practicalTask: raw.practicalTask,
    modules,
    curriculumSource: raw.curriculumSource,
    active: true,
  };
}

export const DOMAINS: Domain[] = rawDomains.map(buildDomain);

/**
 * Assessment metadata for every screen. The questions themselves — and their
 * answers — are built only on the server, in data/assessment-bank.ts.
 */
function questionCountFor(module: Module): number {
  return module.concepts.length + (module.concepts.length >= 3 ? 1 : 0);
}

function buildAssessmentInfo(): AssessmentInfo[] {
  const all: AssessmentInfo[] = [];
  for (const domain of DOMAINS) {
    for (const module of domain.modules) {
      all.push({
        id: module.assessmentId,
        domainId: domain.id,
        moduleId: module.id,
        kind: "module",
        title: `Module ${String(module.number).padStart(2, "0")} — ${module.title}`,
        description: `A short assessment covering the key concepts from ${module.title}.`,
        passingScore: PASSING_SCORE,
        durationMinutes: 10,
        questionCount: questionCountFor(module),
      });
    }
    all.push({
      id: `${domain.id}-final`,
      domainId: domain.id,
      moduleId: null,
      kind: "final",
      title: `${domain.name} — Final Assessment`,
      description: `${domain.modules.length} questions sampled across every module of the track.`,
      passingScore: PASSING_SCORE,
      durationMinutes: 30,
      questionCount: domain.modules.length,
    });
  }
  return all;
}

export const ASSESSMENTS: AssessmentInfo[] = buildAssessmentInfo();

const domainIndex = new Map(DOMAINS.map((d) => [d.id, d]));
const assessmentIndex = new Map(ASSESSMENTS.map((a) => [a.id, a]));
const moduleIndex = new Map(
  DOMAINS.flatMap((d) => d.modules).map((m) => [m.id, m]),
);

export function getDomain(id: string | null | undefined): Domain | undefined {
  if (!id) return undefined;
  return domainIndex.get(id);
}

export function getModule(id: string | null | undefined): Module | undefined {
  if (!id) return undefined;
  return moduleIndex.get(id);
}

export function getAssessment(id: string | null | undefined): AssessmentInfo | undefined {
  if (!id) return undefined;
  return assessmentIndex.get(id);
}

export function getDomainAssessments(domainId: string): AssessmentInfo[] {
  return ASSESSMENTS.filter((a) => a.domainId === domainId && a.kind === "module");
}

export function getFinalAssessment(domainId: string): AssessmentInfo | undefined {
  return assessmentIndex.get(`${domainId}-final`);
}

export const DOMAIN_IDS = DOMAINS.map((d) => d.id);
export const PASSING_THRESHOLD = PASSING_SCORE;

/** Domains grouped into the three public clusters, in display order. */
export function domainsByCluster(): { cluster: DomainCluster; domains: Domain[] }[] {
  return CLUSTERS.map((cluster) => ({
    cluster,
    domains: DOMAINS.filter((d) => d.cluster === cluster),
  })).filter((group) => group.domains.length > 0);
}
