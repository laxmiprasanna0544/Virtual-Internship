/**
 * Small deterministic PRNG helpers.
 *
 * Everything that looks "random" in this demo (option ordering, sampled
 * questions, seeded analytics) has to be stable between the server render and
 * the client hydration, so we never use Math.random() for rendered output.
 */

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seed: string): () => number {
  return mulberry32(hashString(seed));
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = seededRandom(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function seededPick<T>(items: T[], count: number, seed: string): T[] {
  return seededShuffle(items, seed).slice(0, count);
}

export function seededInt(seed: string, min: number, max: number): number {
  const rng = seededRandom(seed);
  return min + Math.floor(rng() * (max - min + 1));
}
