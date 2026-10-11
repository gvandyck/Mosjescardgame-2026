import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// mosje_azn_cless: Level 1 Power 0, Level 2 Power 10
const def = MOSJES.find((m: any) => m.id === "mosje_azn_cless");

describe("getPower (E14)", () => {
  it("Power-0 Level 1 with -10 boost stays 0", () => {
    const s = createMosjeSlot(def, { level: 1 });
    s.powerBoost = -10;
    expect(getPower(s)).toBe(0);
  });
  it("Level 2 row Power + 20 boost", () => {
    const s = createMosjeSlot(def, { level: 2 });
    s.powerBoost = 20;
    expect(getPower(s)).toBe(def.levels[1].power + 20);
  });
  it("is a non-negative multiple of 10 and never NaN for bad levels", () => {
    for (const lv of [0, 9, NaN, 1, 2, 3]) {
      const s = createMosjeSlot(def, { level: 1 });
      s.level = lv;
      s.powerBoost = 7;
      const p = getPower(s);
      expect(Number.isNaN(p)).toBe(false);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p % 10).toBe(0);
    }
  });
  it("no boost -> plain level row Power", () => {
    expect(getPower(createMosjeSlot(def, { level: 2 }))).toBe(def.levels[1].power);
  });
});
