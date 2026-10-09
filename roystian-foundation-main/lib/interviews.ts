import { questionsFor } from "@/data/interviews";
import { clamp } from "@/lib/utils";
import type { InterviewKind, InterviewQuestion, InterviewSession } from "@/types";

/**
 * Mock interview feedback.
 *
 * There is no model behind this. Scoring is a transparent heuristic over what
 * the student actually wrote: how much they said, whether it is structured,
 * whether it contains specifics, and whether it engages the competencies the
 * question is looking for. This is stated to the student in the UI — it would
 * be dishonest to present a rubric as an evaluation it is not.
 *
 * The heuristic is deliberately generous about content and strict about
 * structure and specificity, because those are the two things a student can
 * actually fix between attempts.
 */

/** Words that signal a concrete, situated answer rather than a generic one. */
const SPECIFICITY_MARKERS =
  /\b(\d+%?|first|then|after|because|for example|specifically|instead|resulted|measured|reduced|increased|we|i built|i wrote|i found|i decided)\b/gi;

/** Signals the answer is organised rather than a single run-on thought. */
const STRUCTURE_MARKERS =
  /\b(first|second|third|next|then|finally|however|although|whereas|the problem was|the result was|my approach)\b/gi;

/** Filler that adds length without adding substance. */
const HEDGE_MARKERS =
  /\b(basically|actually|kind of|sort of|you know|i guess|maybe|probably|i think that|just)\b/gi;

interface AnswerScore {
  clarity: number;
  structure: number;
  depth: number;
}

function scoreAnswer(answer: string, question: InterviewQuestion): AnswerScore {
  const text = answer.trim();
  if (text.length === 0) {
    return { clarity: 0, structure: 0, depth: 0 };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const specifics = (text.match(SPECIFICITY_MARKERS) ?? []).length;
  const structural = (text.match(STRUCTURE_MARKERS) ?? []).length;
  const hedges = (text.match(HEDGE_MARKERS) ?? []).length;

  /* Clarity — is it the right length, in readable sentences, without filler? */
  // Under 40 words is usually too thin to be convincing; over 320 rambles.
  const lengthFit =
    wordCount < 40
      ? (wordCount / 40) * 70
      : wordCount <= 260
        ? 100
        : Math.max(60, 100 - (wordCount - 260) / 8);
  const avgSentence = wordCount / Math.max(sentences.length, 1);
  // 12–28 words per sentence reads well aloud; outside that it degrades.
  const sentenceFit =
    avgSentence < 8 ? 60 : avgSentence <= 28 ? 100 : Math.max(50, 100 - (avgSentence - 28) * 3);
  const hedgePenalty = Math.min(hedges * 6, 30);
  const clarity = clamp(
    Math.round(lengthFit * 0.5 + sentenceFit * 0.5 - hedgePenalty),
    0,
    100,
  );

  /* Structure — are there signposts, and more than one sentence? */
  const signposts = Math.min(structural, 5) * 16;
  const multiSentence = sentences.length >= 3 ? 20 : sentences.length === 2 ? 10 : 0;
  const structure = clamp(signposts + multiSentence, 0, 100);

  /* Depth — specifics, and engagement with what the question looks for. */
  const specificScore = Math.min(specifics, 6) * 12;
  const keywordHits = question.lookingFor.filter((point) => {
    const terms = point
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((t) => t.length > 5);
    return terms.some((t) => text.toLowerCase().includes(t));
  }).length;
  const coverage = (keywordHits / Math.max(question.lookingFor.length, 1)) * 30;
  const depth = clamp(Math.round(specificScore + coverage), 0, 100);

  return { clarity, structure, depth };
}

export interface InterviewFeedback {
  scores: AnswerScore;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  perQuestion: {
    questionId: string;
    prompt: string;
    answered: boolean;
    scores: AnswerScore;
    note: string;
  }[];
}

export function evaluateInterview(
  kind: InterviewKind,
  domainName: string,
  answers: Record<string, string>,
): InterviewFeedback {
  const questions = questionsFor(kind, domainName);

  const perQuestion = questions.map((question) => {
    const answer = answers[question.id] ?? "";
    const scores = scoreAnswer(answer, question);
    return {
      questionId: question.id,
      prompt: question.prompt,
      answered: answer.trim().length > 0,
      scores,
      note: noteFor(scores, answer),
    };
  });

  const answered = perQuestion.filter((q) => q.answered);
  const average = (pick: keyof AnswerScore) =>
    answered.length
      ? Math.round(
          answered.reduce((sum, q) => sum + q.scores[pick], 0) / answered.length,
        )
      : 0;

  const scores: AnswerScore = {
    clarity: average("clarity"),
    structure: average("structure"),
    depth: average("depth"),
  };

  // Unanswered questions reduce the overall score — skipping is not neutral.
  const completion = answered.length / Math.max(questions.length, 1);
  const raw = (scores.clarity + scores.structure + scores.depth) / 3;
  const overallScore = clamp(Math.round(raw * (0.5 + 0.5 * completion)), 0, 100);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (scores.clarity >= 70) strengths.push("Answers are the right length and easy to follow.");
  else if (answered.length)
    improvements.push(
      scores.clarity < 45
        ? "Answers are too short or too padded — aim for 60–150 words per question."
        : "Tighten your sentences and cut filler words.",
    );

  if (scores.structure >= 70)
    strengths.push("You signpost your answers, which makes them easy to follow.");
  else if (answered.length)
    improvements.push(
      "Structure each answer — situation, what you did, what resulted.",
    );

  if (scores.depth >= 70)
    strengths.push("You back claims with specifics rather than adjectives.");
  else if (answered.length)
    improvements.push(
      "Add concrete detail — numbers, decisions, what you actually did.",
    );

  if (completion < 1) {
    improvements.push(
      `You left ${questions.length - answered.length} question${questions.length - answered.length === 1 ? "" : "s"} unanswered. In a real interview you must say something.`,
    );
  }

  if (strengths.length === 0 && answered.length > 0) {
    strengths.push("You completed the session — that is the hardest part.");
  }

  return { scores, overallScore, strengths, improvements, perQuestion };
}

function noteFor(scores: AnswerScore, answer: string): string {
  if (answer.trim().length === 0) return "Not answered.";
  const weakest = (
    Object.entries(scores) as [keyof AnswerScore, number][]
  ).sort((a, b) => a[1] - b[1])[0];

  if (weakest[1] >= 70) return "A strong answer across all three measures.";
  if (weakest[0] === "clarity")
    return "The content is there; the delivery needs tightening.";
  if (weakest[0] === "structure")
    return "Good material, but a listener would lose the thread. Signpost it.";
  return "Add a specific example — this reads as general rather than lived.";
}

export function buildSession(
  id: string,
  studentId: string,
  kind: InterviewKind,
  domainId: string,
  answers: Record<string, string>,
  feedback: InterviewFeedback,
): InterviewSession {
  return {
    id,
    studentId,
    kind,
    domainId,
    answers,
    scores: feedback.scores,
    overallScore: feedback.overallScore,
    strengths: feedback.strengths,
    improvements: feedback.improvements,
    completedAt: new Date().toISOString(),
  };
}
