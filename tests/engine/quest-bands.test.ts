import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { isBandWin } from "../../src/engine/quests/isBandWin.js";
// @ts-expect-error — JS module
import { QUESTS } from "../../src/data/quests.js";
// @ts-expect-error — JS module
import { QUEST_BANDS } from "../../src/data/questBands.js";

describe("isBandWin (E16)", () => {
  it("steady", () => { expect(isBandWin("steady", [4])).toBe(true); expect(isBandWin("steady", [3])).toBe(false); });
  it("skilled needs two 4+", () => { expect(isBandWin("skilled", [4, 4])).toBe(true); expect(isBandWin("skilled", [4, 3])).toBe(false); });
  it("heroic needs two 5+", () => { expect(isBandWin("heroic", [5, 5])).toBe(true); expect(isBandWin("heroic", [5, 4])).toBe(false); });
  it("single-4+ bands", () => {
    for (const b of ["prepared", "gated", "coin_flip"]) { expect(isBandWin(b, [1, 4])).toBe(true); expect(isBandWin(b, [3, 2])).toBe(false); }
  });
  it("trained never rolls", () => expect(isBandWin("trained", [])).toBe(true));
});

describe("2.0 Quest data guard", () => {
  it("every 2.0 Quest band exists and win/lose match the band row", () => {
    const rows = QUESTS.filter((q: any) => q.stack);
    expect(rows.length).toBeGreaterThan(0);
    for (const q of rows) {
      const band = QUEST_BANDS[q.band];
      expect(band, q.id).toBeDefined();
      expect(q.win, q.id).toBe(band.win);
      expect(q.lose, q.id).toBe(band.lose);
    }
  });
});
