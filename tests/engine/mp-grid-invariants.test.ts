import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { applyGainToSlot } from "../../src/engine/mp/applyGainToSlot.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

describe("E27 gain side: grid invariants", () => {
  it("500 random gains keep MP on the 5-grid and inside the level bounds", () => {
    const r = rng(54);
    for (let i = 0; i < 500; i++) {
      const level = 1 + Math.floor(r() * 3);
      const start = Math.floor(r() * 20) * 5;
      const s = createMosjeSlot(def, { level, mp: start });
      applyGainToSlot(s, 1 + Math.floor(r() * 150), { turnNumber: i });
      expect(s.mp % 5).toBe(0);
      expect(s.mp).toBeGreaterThanOrEqual(0);
      expect(s.level).toBeGreaterThanOrEqual(1);
      expect(s.level).toBeLessThanOrEqual(3);
      if (s.level === 3) expect(s.mp).toBeLessThanOrEqual(95);
      else expect(s.mp).toBeLessThan(100);
    }
  });
  it("a gain levels at most once", () => {
    const r = rng(7);
    for (let i = 0; i < 100; i++) {
      const level = 1 + Math.floor(r() * 2);
      const s = createMosjeSlot(def, { level, mp: 95 });
      applyGainToSlot(s, 5 + Math.floor(r() * 300));
      expect(s.level).toBe(level + 1);
    }
  });
});
