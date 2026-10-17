/**
 * The downloadable learning guide for each domain: one complete PDF covering
 * every module, with worked examples, checkpoints and a practice assessment.
 *
 * Files live in content/guides/<domainId>.pdf — outside public/, so they are
 * only served to students enrolled in the domain (app/api/student/guides).
 */
export interface LearningGuide {
  domainId: string;
  pages: number;
  bytes: number;
}

const GUIDES: Record<string, Omit<LearningGuide, "domainId">> = {
  "ai-ml": { pages: 17, bytes: 191508 },
  "business-analytics": { pages: 27, bytes: 199262 },
  "data-analytics": { pages: 22, bytes: 189705 },
  "full-stack-development": { pages: 27, bytes: 201657 },
  "iot-electronics": { pages: 16, bytes: 190368 },
  "java-development": { pages: 21, bytes: 188103 },
  "mechanical-engineering": { pages: 11, bytes: 177612 },
  "python-development": { pages: 26, bytes: 200044 },
  "sales-marketing": { pages: 11, bytes: 6351393 },
  "software-development": { pages: 25, bytes: 195200 },
  "software-testing": { pages: 15, bytes: 180692 },
  "sustainability": { pages: 11, bytes: 177617 },
};

export function getLearningGuide(domainId: string | null | undefined): LearningGuide | null {
  if (!domainId || !(domainId in GUIDES)) return null;
  return { domainId, ...GUIDES[domainId] };
}

export function guideDownloadUrl(domainId: string): string {
  return `/api/student/guides/${encodeURIComponent(domainId)}`;
}

export function guideSizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
