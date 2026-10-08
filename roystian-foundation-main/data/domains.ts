import { rawDomains } from "./curriculum";
import type { RawDomain, RawModule } from "./curriculum";
import { seededInt, seededPick, seededShuffle } from "@/lib/random";
import type {
  Assessment,
  Concept,
  Domain,
  DomainCluster,
  Module,
  Question,
  Resource,
} from "@/types";
import { careerDataFor, CLUSTER_OF, CLUSTERS } from "@/data/career-pathways";

const PASSING_SCORE = 70;

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

function buildQuestions(
  moduleId: string,
  moduleTitle: string,
  concepts: Concept[],
  definitionPool: Concept[],
): Question[] {
  const questions: Question[] = concepts.map((concept, i) => {
    const distractors = seededPick(
      definitionPool.filter(
        (candidate) =>
          candidate.term !== concept.term &&
          candidate.definition !== concept.definition,
      ),
      3,
      `${moduleId}-q${i}-distractors`,
    ).map((candidate) => candidate.definition);

    const options = seededShuffle(
      [concept.definition, ...distractors],
      `${moduleId}-q${i}-options`,
    );

    return {
      id: `${moduleId}-q${i + 1}`,
      type: "single" as const,
      prompt: `Which of the following best describes ${concept.term}?`,
      options,
      correct: [options.indexOf(concept.definition)],
      explanation: `${concept.term} — ${concept.definition}`,
    };
  });

  // One multi-select question that mixes correct and mismatched term/definition pairs.
  if (concepts.length >= 3) {
    const correctPairs = concepts
      .slice(0, 2)
      .map((c) => `${c.term} — ${c.definition}`);
    const wrongPairs = [
      `${concepts[2].term} — ${concepts[0].definition}`,
      `${concepts[concepts.length - 1].term} — ${concepts[1].definition}`,
    ];
    const options = seededShuffle(
      [...correctPairs, ...wrongPairs],
      `${moduleId}-multi-options`,
    );
    questions.push({
      id: `${moduleId}-q${concepts.length + 1}`,
      type: "multiple",
      prompt: `${moduleTitle}: select every statement below that pairs the term with the correct description.`,
      options,
      correct: correctPairs
        .map((pair) => options.indexOf(pair))
        .sort((a, b) => a - b),
      explanation:
        "Two of these pairings swap descriptions between terms. Read the term first, then check whether the description actually belongs to it.",
    });
  }

  return questions;
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

function buildAssessments(): Assessment[] {
  const all: Assessment[] = [];

  for (const domain of DOMAINS) {
    const definitionPool = domain.modules.flatMap((m) => m.concepts);

    for (const module of domain.modules) {
      all.push({
        id: module.assessmentId,
        domainId: domain.id,
        moduleId: module.id,
        kind: "module",
        title: `Module ${String(module.number).padStart(2, "0")} — ${module.title}`,
        description: `A short demo assessment covering the key concepts from ${module.title}.`,
        passingScore: PASSING_SCORE,
        durationMinutes: 10,
        questions: buildQuestions(
          module.id,
          module.title,
          module.concepts,
          definitionPool,
        ),
      });
    }

    // Final assessment — one sampled question per module, ten in total.
    const finalQuestions: Question[] = domain.modules.map((module, index) => {
      const moduleQuestions = buildQuestions(
        module.id,
        module.title,
        module.concepts,
        definitionPool,
      );
      const picked =
        moduleQuestions[
          seededInt(`${domain.id}-final-${index}`, 0, moduleQuestions.length - 1)
        ];
      return { ...picked, id: `${domain.id}-final-q${index + 1}` };
    });

    all.push({
      id: `${domain.id}-final`,
      domainId: domain.id,
      moduleId: null,
      kind: "final",
      title: `${domain.name} — Final Assessment`,
      description:
        "Demo Assessment. The live programme uses 25–50 questions; this demo environment uses 10 questions sampled across every module of the track.",
      passingScore: PASSING_SCORE,
      durationMinutes: 30,
      questions: finalQuestions,
    });
  }

  return all;
}

export const ASSESSMENTS: Assessment[] = buildAssessments();

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

export function getAssessment(id: string | null | undefined): Assessment | undefined {
  if (!id) return undefined;
  return assessmentIndex.get(id);
}

export function getDomainAssessments(domainId: string): Assessment[] {
  return ASSESSMENTS.filter((a) => a.domainId === domainId && a.kind === "module");
}

export function getFinalAssessment(domainId: string): Assessment | undefined {
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
