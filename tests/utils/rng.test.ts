import { describe, expect, it } from "vitest";
import { createRng } from "../../src/utils/rng.js";

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(1337);
    const b = createRng(1337);

    const seqA = [a.next(), a.next(), a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next(), b.next(), b.next()];

    expect(seqA).toStrictEqual(seqB);
  });

  it("rollD6 has rough distribution sanity over 10000 rolls", () => {
    const rng = createRng(99);
    const counts = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i < 10_000; i += 1) {
      const roll = rng.rollD6();
      counts[roll - 1] += 1;
    }

    for (const count of counts) {
      expect(count).toBeGreaterThan(1_300);
      expect(count).toBeLessThan(2_000);
    }
  });
});
