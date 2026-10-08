import type { InterviewKind, InterviewQuestion } from "@/types";

/**
 * Mock Interview Centre question bank.
 *
 * Technical questions are templated per domain at render time so a Mechanical
 * student is not asked about hash maps. HR and project questions are
 * domain-neutral by design — they test how someone talks about their work.
 */

export const INTERVIEW_KINDS: {
  kind: InterviewKind;
  title: string;
  blurb: string;
  icon: string;
}[] = [
  {
    kind: "technical",
    title: "Technical Interview",
    blurb: "Domain-specific questions and problem-solving scenarios.",
    icon: "Code2",
  },
  {
    kind: "hr",
    title: "HR Interview",
    blurb: "Behavioural and situational questions for professional readiness.",
    icon: "Users",
  },
  {
    kind: "project",
    title: "Project Interview",
    blurb: "Present and defend the work you actually completed.",
    icon: "Presentation",
  },
];

const HR_QUESTIONS: InterviewQuestion[] = [
  {
    id: "hr-1",
    kind: "hr",
    prompt: "Tell me about yourself.",
    lookingFor: [
      "A structure — where you are now, what you have done, where you are going",
      "Specifics rather than adjectives",
      "Relevance to the role, not a life history",
      "Roughly ninety seconds of material",
    ],
    followUp: "Which part of that are you proudest of, and why?",
  },
  {
    id: "hr-2",
    kind: "hr",
    prompt:
      "Describe a time you were given feedback you disagreed with. What did you do?",
    lookingFor: [
      "A real situation, not a hypothetical",
      "Evidence you actually listened before responding",
      "A decision and its outcome",
      "Self-awareness without self-flagellation",
    ],
    followUp: "What would you do differently now?",
  },
  {
    id: "hr-3",
    kind: "hr",
    prompt:
      "You are behind on a deadline and cannot finish everything. How do you handle it?",
    lookingFor: [
      "Early communication rather than late surprise",
      "Explicit prioritisation with a stated reason",
      "Ownership of the trade-off",
      "A concrete example if you have one",
    ],
    followUp: "Who do you tell first, and what exactly do you say?",
  },
  {
    id: "hr-4",
    kind: "hr",
    prompt: "Why this field, and why now?",
    lookingFor: [
      "A specific trigger rather than a generic interest",
      "Evidence of the interest in what you have done",
      "A forward view that is realistic",
    ],
    followUp: "What is the part of this work you expect to find hardest?",
  },
  {
    id: "hr-5",
    kind: "hr",
    prompt: "Tell me about something you failed at.",
    lookingFor: [
      "A genuine failure, not a disguised strength",
      "Your own contribution to it, stated plainly",
      "What changed afterwards",
    ],
    followUp: "How do you know the lesson actually stuck?",
  },
];

const PROJECT_QUESTIONS: InterviewQuestion[] = [
  {
    id: "project-1",
    kind: "project",
    prompt:
      "Walk me through your project. Start with the problem, not the technology.",
    lookingFor: [
      "The problem stated before the solution",
      "Why it mattered to someone",
      "Your specific contribution",
      "The outcome, with a number if one exists",
    ],
    followUp: "What was the hardest decision you made in it?",
  },
  {
    id: "project-2",
    kind: "project",
    prompt: "What would you do differently if you started it again?",
    lookingFor: [
      "Genuine critique rather than false modesty",
      "A technical or methodological reason",
      "Evidence you understand the trade-off you made",
    ],
    followUp: "What stopped you doing it that way the first time?",
  },
  {
    id: "project-3",
    kind: "project",
    prompt: "How do you know your result is correct?",
    lookingFor: [
      "A verification method, not confidence",
      "Awareness of what could have gone wrong",
      "Stated limitations",
    ],
    followUp: "What would have to be true for your conclusion to be wrong?",
  },
  {
    id: "project-4",
    kind: "project",
    prompt:
      "Explain the most technical part of your project to someone non-technical.",
    lookingFor: [
      "An analogy that holds up",
      "No unexplained jargon",
      "The 'so what' reached quickly",
    ],
    followUp: "Now explain it to someone who knows more than you do.",
  },
];

/** Technical prompts are parameterised — {domain} is substituted per student. */
const TECHNICAL_TEMPLATES: Omit<InterviewQuestion, "id" | "kind">[] = [
  {
    prompt:
      "What is the concept from {domain} that you understand best, and how would you explain it to a first-year student?",
    lookingFor: [
      "A correct, complete explanation",
      "Structure — definition, then why it matters, then an example",
      "Confidence without overclaiming",
    ],
    followUp: "Where does that concept break down or stop applying?",
  },
  {
    prompt:
      "Describe a problem in {domain} you found genuinely difficult. How did you approach it?",
    lookingFor: [
      "A real problem with real difficulty",
      "A method, not a lucky guess",
      "What you tried that did not work",
    ],
    followUp: "How long did you spend before changing approach?",
  },
  {
    prompt:
      "Your solution works but is too slow, too expensive or too fragile for production. Walk me through how you would diagnose which.",
    lookingFor: [
      "Measurement before optimisation",
      "Isolating the bottleneck rather than guessing",
      "Awareness of the trade-off being made",
    ],
    followUp: "What would you measure first, and with what?",
  },
  {
    prompt:
      "How do you keep current in {domain}, and what have you learned recently that changed how you work?",
    lookingFor: [
      "Specific sources, not 'the internet'",
      "A concrete recent example",
      "Evidence the learning changed behaviour",
    ],
    followUp: "What is something you believed a year ago that you no longer do?",
  },
  {
    prompt:
      "You disagree with a senior colleague about a technical decision in {domain}. How do you handle it?",
    lookingFor: [
      "Evidence gathered before arguing",
      "Separating the idea from the person",
      "Willingness to commit once a decision is made",
    ],
    followUp: "What if you are overruled and you still think you are right?",
  },
];

export function technicalQuestions(domainName: string): InterviewQuestion[] {
  return TECHNICAL_TEMPLATES.map((template, index) => ({
    id: `technical-${index + 1}`,
    kind: "technical" as const,
    ...template,
    prompt: template.prompt.replace(/\{domain\}/g, domainName),
  }));
}

export function questionsFor(
  kind: InterviewKind,
  domainName: string,
): InterviewQuestion[] {
  if (kind === "technical") return technicalQuestions(domainName);
  if (kind === "hr") return HR_QUESTIONS;
  return PROJECT_QUESTIONS;
}
