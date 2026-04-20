export function U3_selectRandomHandIndex(handSize, rng) {
  if (!Number.isInteger(handSize) || handSize <= 0) return -1;

  const randomFn = typeof rng === "function" ? rng : Math.random;
  const raw = randomFn();
  const normalized = raw < 0 ? 0 : raw >= 1 ? 0.999999999 : raw;

  return Math.floor(normalized * handSize);
}
