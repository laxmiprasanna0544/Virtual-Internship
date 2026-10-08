import type { Challenge } from "@/types";

/**
 * The Roystian Industry Challenge.
 *
 * Challenges sit outside the structured curriculum: open-ended problems where
 * the student demonstrates they can apply knowledge rather than consume
 * content. They feed the problem-solving component of the readiness score and
 * the Industry Challenge badge, and are part of what the Advanced Internship
 * pathway considers.
 */
export const CHALLENGES: Challenge[] = [
  {
    id: "challenge-ai",
    kind: "ai",
    title: "AI Challenge",
    icon: "BrainCircuit",
    summary:
      "Build a model that makes a decision someone would actually act on.",
    brief:
      "You are given a dataset and a decision that currently gets made on instinct. Build something that improves on instinct, prove that it does, and state honestly where it should not be trusted. A model that is 95% accurate and unusable scores lower than one that is 80% accurate and deployable.",
    domainIds: ["ai-ml", "data-analytics", "python-development"],
    requirements: [
      "State the decision being improved and the current baseline",
      "Build and evaluate at least two approaches",
      "Report the metric that matters for this decision, and say why",
      "Identify where the model should not be trusted",
      "Recommend whether it is ready to use",
    ],
    evaluationCriteria: [
      "Problem framing — is the right question being answered?",
      "Technical execution — is the method sound?",
      "Honest evaluation — are limitations surfaced rather than hidden?",
      "Decision usefulness — could someone act on this?",
    ],
    durationLabel: "7 days",
    difficulty: "advanced",
    active: true,
  },
  {
    id: "challenge-coding",
    kind: "coding",
    title: "Coding Challenge",
    icon: "Code2",
    summary:
      "Ship a working feature against a specification written by someone else.",
    brief:
      "You receive a specification with three deliberate ambiguities and a codebase with an established style. Build the feature, resolve the ambiguities by asking the right questions in your write-up, and leave the codebase better than you found it.",
    domainIds: [
      "full-stack-development",
      "python-development",
      "java-development",
      "software-development",
    ],
    requirements: [
      "Identify the ambiguities in the specification and state your interpretation",
      "Implement the feature following the existing conventions",
      "Cover the change with tests",
      "Keep commits reviewable",
      "Explain any trade-off you made under time pressure",
    ],
    evaluationCriteria: [
      "Correctness — does it do what was asked?",
      "Ambiguity handling — were the gaps spotted and resolved sensibly?",
      "Code quality — would a reviewer approve this?",
      "Communication — is the reasoning legible?",
    ],
    durationLabel: "5 days",
    difficulty: "intermediate",
    active: true,
  },
  {
    id: "challenge-data",
    kind: "data",
    title: "Data Challenge",
    icon: "LineChart",
    summary: "Find the story in a dataset that nobody has looked at properly.",
    brief:
      "You are handed an operational dataset and a vague question from a stakeholder. Sharpen the question, answer it with evidence, and deliver a recommendation the stakeholder can act on this week.",
    domainIds: ["data-analytics", "business-analytics", "ai-ml"],
    requirements: [
      "Restate the vague question as something answerable",
      "Profile the data and disclose its quality problems",
      "Answer the question with evidence, not assertion",
      "Produce at most three charts, each earning its place",
      "Give one prioritised recommendation",
    ],
    evaluationCriteria: [
      "Question framing — was the real question found?",
      "Analytical rigour — do the conclusions follow from the data?",
      "Data honesty — are quality issues disclosed?",
      "Actionability — could the stakeholder act on Monday?",
    ],
    durationLabel: "5 days",
    difficulty: "intermediate",
    active: true,
  },
  {
    id: "challenge-testing",
    kind: "software-testing",
    title: "Software Testing Challenge",
    icon: "Bug",
    summary: "Break a build that its authors believe is finished.",
    brief:
      "You are given a build the team considers release-ready and its existing test suite. Find what the suite misses. Every defect you report must be reproducible by someone who has never seen the application.",
    domainIds: ["software-testing", "software-development"],
    requirements: [
      "Assess what the existing suite covers and what it does not",
      "Find defects the suite misses",
      "Write reproduction steps precise enough for a stranger",
      "Prioritise by real user impact, not by how clever the find was",
      "Give a release-risk verdict",
    ],
    evaluationCriteria: [
      "Coverage analysis — were the gaps found systematically?",
      "Defect quality — are reports reproducible and precise?",
      "Prioritisation — does severity reflect user impact?",
      "Verdict — is the release call defensible?",
    ],
    durationLabel: "5 days",
    difficulty: "intermediate",
    active: true,
  },
  {
    id: "challenge-business",
    kind: "business-case",
    title: "Business Case Challenge",
    icon: "Briefcase",
    summary: "Make a recommendation you would defend to a board.",
    brief:
      "A company faces a decision with incomplete information and real money attached. Build the case, state your assumptions openly, and be clear about what would change your mind.",
    domainIds: ["business-analytics", "sales-marketing", "data-analytics"],
    requirements: [
      "Define the decision criteria before reaching a conclusion",
      "Build a transparent model with stated assumptions",
      "Test the two assumptions that matter most",
      "Make a single clear recommendation",
      "State the evidence that would reverse it",
    ],
    evaluationCriteria: [
      "Framing — are criteria set independently of the answer?",
      "Analytical quality — is the model sound and transparent?",
      "Assumption testing — is uncertainty handled honestly?",
      "Conviction — is there a real recommendation, not a hedge?",
    ],
    durationLabel: "7 days",
    difficulty: "advanced",
    active: true,
  },
  {
    id: "challenge-sustainability",
    kind: "sustainability",
    title: "Sustainability Challenge",
    icon: "Leaf",
    summary: "Separate a real environmental gain from a claimed one.",
    brief:
      "An organisation has published an impact claim. You have the underlying data. Determine whether the claim holds, what the defensible figure is, and what should be measured going forward.",
    domainIds: ["sustainability", "mechanical-engineering", "iot-electronics"],
    requirements: [
      "Reconstruct the claim from the underlying data",
      "Normalise for the confounders that would distort it",
      "State the defensible figure with its uncertainty",
      "Identify what makes the original claim unsupportable, if it is",
      "Recommend a forward measurement approach",
    ],
    evaluationCriteria: [
      "Verification rigour — were confounders handled?",
      "Attribution — is the effect correctly isolated?",
      "Honesty — is uncertainty stated plainly?",
      "Forward design — is the recommendation practical?",
    ],
    durationLabel: "7 days",
    difficulty: "advanced",
    active: true,
  },
];

export function getChallenge(id: string | null | undefined): Challenge | undefined {
  if (!id) return undefined;
  return CHALLENGES.find((c) => c.id === id);
}

/** Challenges most relevant to a domain, with the rest still available after. */
export function challengesForDomain(domainId: string | null | undefined): {
  recommended: Challenge[];
  others: Challenge[];
} {
  const active = CHALLENGES.filter((c) => c.active);
  if (!domainId) return { recommended: [], others: active };
  const recommended = active.filter((c) => c.domainIds.includes(domainId));
  const others = active.filter((c) => !c.domainIds.includes(domainId));
  return { recommended, others };
}
