// Replaces the V4 'Ronald Kip stacking test' (CLAUDE.md) under 2.0 MP rules for Phase 54;
// Phase 59 rewrites it to the Card List text. Expected values are what effect_ronald_kip /
// applyMPGain produce today (base 50 / 60 with Ronald / 100 with FOOD-double, Amplifier x1.5
// snapped to the 5-grid), then run through applyGainToSlot: 100+ levels up to 0, L3 caps at 95.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module, no type declarations
import { effect_ronald_kip } from "../../src/abilities/piecieEffects.js";

const defOf = (id: string) => MOSJES.find((m: any) => m.id === id);

function slot(id: string, level: number, mp: number) {
  const s = createMosjeSlot(defOf(id), { level, mp });
  s.entryProtected = false;
  return s;
}

function kip(target: any, partner: any | null, mod?: (p: any) => void) {
  const st = makeEngineState({ players: { player_1: { activeSlots: [target, partner] } } });
  if (mod) mod(st.players.player_1);
  const out = effect_ronald_kip(st, "player_1");
  return out.players.player_1.activeSlots[0];
}

describe("Ronald Kip stacking under 2.0 MP rules", () => {
  it("alone: +50 on the 5-grid", () => {
    const s = kip(slot("mosje_coert_tech", 1, 10), null);
    expect([s.level, s.mp]).toEqual([1, 60]);
  });

  it("with Ronald The Master Chef on the field: +60", () => {
    const s = kip(slot("mosje_coert_tech", 1, 10), slot("mosje_ronald_chef", 1, 50));
    expect([s.level, s.mp]).toEqual([1, 70]);
  });

  it("with the MP Amplifier: 50 x 1.5 snapped to the grid = +75, flag consumed", () => {
    const s = kip(slot("mosje_coert_tech", 1, 10), null, (p) => { p.mpAmplifierActive = true; });
    expect([s.level, s.mp]).toEqual([1, 85]);
    expect(s.mp % 5).toBe(0);
  });

  it("Binti + Coert FOOD-double (+100) on a Level 1 Mosje at 10 -> Level 2 at 0 (no carry-over)", () => {
    const s = kip(slot("mosje_binti", 1, 10), slot("mosje_coert_tech", 1, 50));
    expect([s.level, s.mp]).toEqual([2, 0]);
  });

  it("a gain that crosses 100 on Level 1 -> Level 2 at 0 MP", () => {
    const s = kip(slot("mosje_coert_tech", 1, 60), null);
    expect([s.level, s.mp]).toEqual([2, 0]);
  });

  it("on Level 3 the gain is capped at 95", () => {
    const s = kip(slot("mosje_coert_tech", 3, 70), null);
    expect([s.level, s.mp]).toEqual([3, 95]);
  });

  it("Amplifier + Ronald stack: (60 x 1.5) = +90 stays on the grid and levels up", () => {
    const s = kip(slot("mosje_coert_tech", 1, 30), slot("mosje_ronald_chef", 1, 50), (p) => { p.mpAmplifierActive = true; });
    expect([s.level, s.mp]).toEqual([2, 0]);
  });
});
