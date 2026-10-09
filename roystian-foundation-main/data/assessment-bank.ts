import "server-only";

/**
 * The assessment question bank, with answers. Server only: the browser gets
 * questions through /api/assessments/[id] with the answers stripped, and
 * scoring happens in /api/assessments/submit.
 *
 * Questions are generated deterministically from each module's concepts, so
 * the bank is identical on every server instance.
 */

import { seededInt, seededPick, seededShuffle } from "@/lib/random";
import { DOMAINS, PASSING_SCORE, getAssessment } from "@/data/domains";
import type { Assessment, Concept, Question } from "@/types";

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
        description: getAssessment(module.assessmentId)!.description,
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
      description: getAssessment(`${domain.id}-final`)!.description,
      passingScore: PASSING_SCORE,
      durationMinutes: 30,
      questions: finalQuestions,
    });
  }

  return all;
}

const BANK: Assessment[] = buildAssessments();
const bankIndex = new Map(BANK.map((a) => [a.id, a]));

/** The full assessment, answers included. */
export function getAssessmentWithAnswers(id: string | null | undefined): Assessment | undefined {
  return id ? bankIndex.get(id) : undefined;
}

export function allAssessmentsWithAnswers(): Assessment[] {
  return BANK;
}