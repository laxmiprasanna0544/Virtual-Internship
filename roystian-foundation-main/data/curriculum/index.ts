import { partA } from "./part-a";
import { partB } from "./part-b";
import { partC } from "./part-c";
import { partD } from "./part-d";
import type { RawDomain } from "./types";

/**
 * Authoring order below is the order domains appear across the product.
 */
export const rawDomains: RawDomain[] = [
  partA[0], // ai-ml
  partA[1], // data-analytics
  partA[2], // business-analytics
  partB[0], // full-stack-development
  partB[1], // software-testing
  partB[2], // python-development
  partC[0], // java-development
  partC[1], // iot-electronics
  partC[2], // sustainability
  partD[0], // sales-marketing
  partD[1], // mechanical-engineering
  partD[2], // software-development
];

export type { RawDomain, RawModule } from "./types";
