export function createRng(seed: number): {
  next: () => number;
  nextInt: (min: number, max: number) => number;
  rollD6: () => 1 | 2 | 3 | 4 | 5 | 6;
} {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new Error("nextInt requires integer min <= max");
    }
    const span = max - min + 1;
    return Math.floor(next() * span) + min;
  };

  const rollD6 = (): 1 | 2 | 3 | 4 | 5 | 6 => {
    return nextInt(1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  };

  return { next, nextInt, rollD6 };
}
