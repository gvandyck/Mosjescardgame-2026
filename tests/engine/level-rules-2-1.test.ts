// 2.1 level rules (rules.md section 5): level-up to 10 MP, Level 3 stops at 100, getemt at Level 2-3 to 10 MP,
// no level-up shield, Power on the 5-grid.
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { applyGainToSlot } from "../../src/engine/mp/applyGainToSlot.js";
// @ts-expect-error — JS module, no type declarations
import { normalizeSlotMp } from "../../src/engine/mp/normalizeSlotMp.js";
// @ts-expect-error — JS module, no type declarations
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { isValidAttackTarget } from "../../src/engine/actions/isValidAttackTarget.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
const cless = MOSJES.find((m: any) => m.id === "mosje_azn_cless");
const slot = (level: number, mp: number) => {
  const s = createMosjeSlot(def, { level, mp });
  s.entryProtected = false;
  return s;
};

function build(level: number, mp: number) {
  const foe = createMosjeSlot(cless, { level: 1, mp: 50 });
  foe.entryProtected = false;
  return makeEngineState({
    players: { player_1: { activeSlots: [slot(level, mp), null] }, player_2: { activeSlots: [foe, null] } },
  });
}
const mine = (s: any) => s.players.player_1.activeSlots[0];

describe("level-up lands on 10 MP (D-08)", () => {
  it("Level 1 at 95 + 10 -> Level 2 at 10 MP with level-2 traits", () => {
    const s = slot(1, 95);
    expect(applyGainToSlot(s, 10, { turnNumber: 3 }).leveled).toBe(true);
    expect([s.level, s.mp, s.levelledUpTurn]).toEqual([2, 10, 3]);
    expect(s.traits).toEqual(def.levels[1].traits);
  });
  it("Level 2 at 95 + 10 -> Level 3 at 10 MP", () => {
    const s = slot(2, 95);
    applyGainToSlot(s, 10);
    expect([s.level, s.mp]).toEqual([3, 10]);
    expect(s.traits).toEqual(def.levels[2].traits);
  });
  it("no carry-over: 95 + 60 also ends at 10", () => {
    const s = slot(1, 95);
    applyGainToSlot(s, 60);
    expect([s.level, s.mp]).toEqual([2, 10]);
  });
  it("normalizeSlotMp levels a 105 slot to 10 MP", () => {
    const s = slot(1, 5);
    s.mp = 105;
    normalizeSlotMp(s, { turnNumber: 2 });
    expect([s.level, s.mp]).toEqual([2, 10]);
  });
});

describe("Level 3 stops at 100 (D-08)", () => {
  it("Level 3 at 90 + 30 -> 100", () => {
    const s = slot(3, 90);
    applyGainToSlot(s, 30);
    expect([s.level, s.mp]).toEqual([3, 100]);
  });
  it("normalizeSlotMp leaves 100 and cuts 105 to 100", () => {
    const a = slot(3, 5); a.mp = 100;
    expect(normalizeSlotMp(a)).toBe(false);
    expect(a.mp).toBe(100);
    const b = slot(3, 5); b.mp = 105;
    normalizeSlotMp(b);
    expect(b.mp).toBe(100);
  });
  it("checkVictory returns the same object for a Level 3 at 100 MP", () => {
    const st = build(3, 100);
    expect(checkVictory(st)).toBe(st);
  });
});

describe("getemt at Level 2-3 lands on 10 MP (D-09)", () => {
  it("Level 2 losing more than it has -> Level 1 at 10", () => {
    const s = loseMP(build(2, 20), "player_1", 0, 30, "DRAIN");
    expect([mine(s).level, mine(s).mp]).toEqual([1, 10]);
    expect(mine(s).traits).toEqual(def.levels[0].traits);
  });
  it("Level 3 -> Level 2 at 10", () => {
    const s = loseMP(build(3, 10), "player_1", 0, 10, "DRAIN");
    expect([mine(s).level, mine(s).mp]).toEqual([2, 10]);
    expect(mine(s).traits).toEqual(def.levels[1].traits);
  });
  it("Level 1 is unchanged: MP 0 and sideways, hit again goes to the pile", () => {
    let s = loseMP(build(1, 10), "player_1", 0, 20, "DRAIN");
    expect([mine(s).mp, mine(s).sideways]).toEqual([0, true]);
    s = loseMP(s, "player_1", 0, 10, "DRAIN");
    expect(mine(s)._pendingWelloe).toBe(true);
  });
});

describe("no level-up shield (D-10)", () => {
  it("a slot that just levelled up has no levelUpProtected and can be attacked", () => {
    const st = build(1, 95);
    const s = mine(st);
    applyGainToSlot(s, 10, { turnNumber: 1 });
    expect(s.levelUpProtected).toBeUndefined();
    expect(isValidAttackTarget(st, "player_2", "player_1", 0)).toBe(true);
  });
  it("a fresh Mosje is still not a valid target", () => {
    const st = build(1, 50);
    mine(st).entryProtected = true;
    expect(isValidAttackTarget(st, "player_2", "player_1", 0)).toBe(false);
  });
});

describe("Power on the 5-grid (D-11)", () => {
  it("returns 5, 15 and 25 and never below 0", () => {
    const a = createMosjeSlot(cless, { level: 1 }); a.powerBoost = 5;
    expect(getPower(a)).toBe(5);
    const b = createMosjeSlot(cless, { level: 2 }); b.powerBoost = 5;
    expect(getPower(b)).toBe(cless.levels[1].power + 5);
    const c = createMosjeSlot(cless, { level: 2 }); c.powerBoost = 15;
    expect(getPower(c)).toBe(cless.levels[1].power + 15);
    const d = createMosjeSlot(cless, { level: 1 }); d.powerBoost = -10;
    expect(getPower(d)).toBe(0);
  });
});
