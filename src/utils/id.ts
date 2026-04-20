export function makeInstanceId(prefix: string, seed: number, counter: number): string {
  if (!prefix.trim()) {
    throw new Error("prefix must be a non-empty string");
  }
  if (!Number.isInteger(seed) || !Number.isInteger(counter) || counter < 0) {
    throw new Error("seed and counter must be valid integers");
  }

  return `${prefix}_${seed.toString(36)}_${counter.toString(36)}`;
}
