/**
 * Practical task submission validation, shared between the client form
 * (immediate feedback) and the /api/submissions/validate route (authoritative
 * check). Pure functions only — safe to import from a server route.
 */

export const ALLOWED_SUBMISSION_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "zip",
  "ipynb",
  "png",
  "jpg",
  "jpeg",
  "py",
  "js",
  "ts",
  "md",
  "txt",
  "json",
];

export const MAX_SUBMISSION_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MIN_SUBMISSION_TEXT_LENGTH = 150;
const MIN_TASK_KEYWORD_MATCHES = 2;

/**
 * Text at or above this length counts as a claimed answer and is checked for
 * relevance to the task, whether or not a file is attached. Below it, the text
 * is treated as a note accompanying an upload ("analysis in the attached
 * notebook") and is not relevance-checked — too short to judge fairly.
 */
const RELEVANCE_MIN_TEXT_LENGTH = 60;

/** Below this, there is not enough text for the repetition heuristic to mean anything. */
const LOW_QUALITY_MIN_TEXT_LENGTH = 20;

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "your", "you", "are",
  "was", "were", "will", "have", "has", "had", "not", "but", "can", "our",
  "their", "they", "them", "into", "onto", "than", "then", "when", "what",
  "which", "who", "how", "why", "each", "all", "any", "some", "such", "over",
  "about", "also", "very", "just", "like", "more", "most", "other", "should",
  "would", "could", "must", "make", "made", "using", "used", "use", "into",
]);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Repeated filler such as "asdf asdf asdf". Applies to any text, however
 * short, because repetition is a reliable signal on its own.
 */
function isRepetitive(text: string): boolean {
  const w = words(text);
  if (w.length < 3) return false;
  const unique = new Set(w.map((s) => s.toLowerCase()));
  return unique.size / w.length < 0.3;
}

/**
 * Too few words to be a complete answer.
 *
 * Deliberately NOT applied to the notes beside an upload: a genuine pointer
 * like "Full analysis is in the attached notebook" is only seven words, and
 * calling that placeholder text would reject a perfectly valid submission.
 */
function isTooShortForAnAnswer(text: string): boolean {
  return words(text).length < 15;
}

export interface SubmissionTaskContext {
  title: string;
  brief: string;
  requirements: string[];
}

export interface SubmissionInput {
  responseText: string;
  fileName: string | null;
  fileSize?: number | null;
}

export interface SubmissionValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateSubmission(
  input: SubmissionInput,
  task: SubmissionTaskContext,
): SubmissionValidationResult {
  const text = input.responseText.trim();
  const hasFile = Boolean(input.fileName);

  if (hasFile) {
    const ext = input.fileName!.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_SUBMISSION_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        reason: `"${ext || "unknown"}" files aren't accepted. Upload one of: ${ALLOWED_SUBMISSION_EXTENSIONS.join(", ")}.`,
      };
    }
    if (
      typeof input.fileSize === "number" &&
      input.fileSize > MAX_SUBMISSION_FILE_BYTES
    ) {
      return { valid: false, reason: "File is larger than the 20MB limit." };
    }
  }

  // A submission with no file has to carry the whole answer in the text.
  // With a file attached the text is supporting notes, so the length floor
  // does not apply — but the content checks below still do.
  if (!hasFile && text.length < MIN_SUBMISSION_TEXT_LENGTH) {
    return {
      valid: false,
      reason: `Add at least ${MIN_SUBMISSION_TEXT_LENGTH} characters describing your work, or attach a file.`,
    };
  }

  // Quality and relevance are checked WITH OR WITHOUT a file.
  //
  // These previously sat inside an `if (!hasFile)` branch, which meant
  // attaching a file waived every content check: the same off-topic answer
  // that was rejected on its own sailed through once any file was present.
  // Attaching a file should add evidence, never waive validation.
  if (text.length >= LOW_QUALITY_MIN_TEXT_LENGTH && isRepetitive(text)) {
    return {
      valid: false,
      reason: hasFile
        ? "Your notes look like placeholder text. Add a short, genuine description of your submission."
        : "Your response looks like placeholder or repeated text. Describe your actual work for this task.",
    };
  }

  // The word-count floor is only meaningful when the text IS the answer.
  if (!hasFile && isTooShortForAnAnswer(text)) {
    return {
      valid: false,
      reason:
        "Your response looks too brief to be a complete answer. Describe your actual work for this task.",
    };
  }

  // Anything long enough to be a claimed answer must relate to the task.
  // Short pointers that merely accompany an upload ("report attached") stay
  // below this threshold and are not relevance-checked, since the file is
  // the deliverable in that case.
  if (text.length >= RELEVANCE_MIN_TEXT_LENGTH) {
    const taskWords = new Set([
      ...significantWords(task.title),
      ...significantWords(task.brief),
      ...task.requirements.flatMap(significantWords),
    ]);
    const responseWords = new Set(significantWords(text));
    let overlap = 0;
    for (const word of taskWords) {
      if (responseWords.has(word)) overlap += 1;
    }
    if (overlap < MIN_TASK_KEYWORD_MATCHES) {
      return {
        valid: false,
        reason:
          "Your response doesn't appear to relate to this practical task. Make sure you address the requirements listed above.",
      };
    }
  }

  return { valid: true };
}
