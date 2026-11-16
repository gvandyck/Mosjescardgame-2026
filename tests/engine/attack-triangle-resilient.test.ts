import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error — JS module
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module
import { LOSS_STEPS } from "../../src/engine/mp/lossSteps.js";
// @ts-expect-error — JS module
import { beatsType } from "../../src/engine/attack/beatsType.js";
// @ts-expect-error — JS module
import { previewAttack } from "../../src/engine/attack/previewAttack.js";
// @ts-expect-error — JS module
import { buildAttackPreview } from "../../src/ui/board/buildAttackPreview.js";
// @ts-expect-error — JS module
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");

function mk(type: string, res: number, mp = 80, power?: number) {
  const s = createMosjeSlot(def, { level: 1, mp });
  s.entryProtected = false;
  s.subtype = type;
  s.traits = { ...(s.traits || {}), resilient: res };
  if (power !== undefined) s.power = power;
  return s;
}

// Attacker Power is set through the slot's own power field; verify with previewAttack().base below.
function build(aType: string, tType: string, res: number, power: number, extraTarget: any = null) {
  const a = mk(aType, 0, 50, power);
  const t = mk(tType, res);
  return makeEngineState({
    players: {
      player_1: { activeSlots: [a, null] },
      player_2: { activeSlots: [t, extraTarget] },
    },
  });
}
const hit = (s: any) =>
  attackMosje(s, "player_1", { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 });
const lost = (s: any, r: any) => 80 - r.state.players.player_2.activeSlots[0].mp;

function withPower(s: any, power: number) {
  const base = previewAttack(s, "player_1", 0, "player_2", 0).base;
  s.players.player_1.activeSlots[0].powerBoost = (s.players.player_1.activeSlots[0].powerBoost || 0) + (power - base);
  return s;
}
function setup(aType: string, tType: string, res: number, power: number) {
  return withPower(build(aType, tType, res, 0), power);
}

describe("beatsType", () => {
  it("the triangle, one way only", () => {
    expect(beatsType("PHYSICAL", "DIGITAL")).toBe(true);
    expect(beatsType("DIGITAL", "CREATIVE")).toBe(true);
    expect(beatsType("CREATIVE", "PHYSICAL")).toBe(true);
    expect(beatsType("DIGITAL", "PHYSICAL")).toBe(false);
    expect(beatsType("CREATIVE", "DIGITAL")).toBe(false);
    expect(beatsType("PHYSICAL", "CREATIVE")).toBe(false);
    expect(beatsType("PHYSICAL", "PHYSICAL")).toBe(false);
    expect(beatsType("PHYSICAL", undefined)).toBe(false);
    expect(beatsType(undefined, undefined)).toBe(false);
  });
});

describe("attack: triangle and Resilient", () => {
  it("Physical on Digital hits +10, the other way gets nothing", () => {
    const s1 = setup("PHYSICAL", "DIGITAL", 0, 20);
    expect(lost(s1, hit(s1))).toBe(30);
    const s2 = setup("DIGITAL", "PHYSICAL", 0, 20);
    expect(lost(s2, hit(s2))).toBe(20);
  });
  it("Res takes 5 per star, floor 5", () => {
    const a = setup("PHYSICAL", "PHYSICAL", 2, 20);
    expect(lost(a, hit(a))).toBe(10);
    const b = setup("PHYSICAL", "PHYSICAL", 2, 10);
    expect(lost(b, hit(b))).toBe(5);
    const c = setup("PHYSICAL", "PHYSICAL", 3, 5);
    expect(lost(c, hit(c))).toBe(5);
  });
  it("Power 0 is no attack, also with the triangle", () => {
    const s = setup("PHYSICAL", "DIGITAL", 2, 0);
    expect(lost(s, hit(s))).toBe(0);
  });
  it("a card reduction runs first, then Resilient", () => {
    const s = setup("PHYSICAL", "PHYSICAL", 1, 30);
    s.players.player_2.activeSlots[0].statusEffects = [{ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 2 }];
    expect(lost(s, hit(s))).toBe(10); // 30 -> 15 -> 10
  });
  describe("a card that stops the whole attack", () => {
    const zero = () => 0;
    afterEach(() => {
      LOSS_STEPS.reducers.splice(LOSS_STEPS.reducers.indexOf(zero), 1);
    });
    it("loses 0, not 5", () => {
      LOSS_STEPS.reducers.push(zero);
      const s = setup("PHYSICAL", "PHYSICAL", 1, 30);
      expect(lost(s, hit(s))).toBe(0);
    });
  });
  it("card effects ignore Resilient", () => {
    for (const source of ["DRAIN", "QUEST"]) {
      const s = setup("PHYSICAL", "PHYSICAL", 3, 20);
      const out = loseMP(s, "player_2", 0, 20, source, false, "player_1");
      expect(80 - out.players.player_2.activeSlots[0].mp).toBe(20);
    }
  });
  it("Dikke Taks: each target gets its own triangle and Resilient", () => {
    const other = mk("PHYSICAL", 2);
    const s = setup("PHYSICAL", "DIGITAL", 0, 20);
    s.players.player_2.activeSlots[1] = other;
    s.players.player_1.activeSlots[0].hitBothOpponents = true;
    const r = hit(s);
    expect(80 - r.state.players.player_2.activeSlots[0].mp).toBe(30); // triangle
    expect(80 - r.state.players.player_2.activeSlots[1].mp).toBe(10); // Res 2, no triangle
  });
});

describe("previewAttack", () => {
  it("returns the four numbers and equals the real attack", () => {
    const s = setup("PHYSICAL", "DIGITAL", 1, 20);
    const p = previewAttack(s, "player_1", 0, "player_2", 0);
    expect(p).toEqual({ base: 20, triangleBonus: 10, resilientReduction: 5, final: 25 });
    expect(lost(s, hit(s))).toBe(p.final);
  });
  it("Power 0 gives zeros and nothing is mutated", () => {
    const s = setup("PHYSICAL", "DIGITAL", 2, 0);
    const before = JSON.stringify(s);
    expect(previewAttack(s, "player_1", 0, "player_2", 0)).toEqual({ base: 0, triangleBonus: 0, resilientReduction: 0, final: 0 });
    const t = setup("PHYSICAL", "DIGITAL", 1, 20);
    const before2 = JSON.stringify(t);
    previewAttack(t, "player_1", 0, "player_2", 0);
    expect(JSON.stringify(s)).toBe(before);
    expect(JSON.stringify(t)).toBe(before2);
  });
  it("the status-strip text shows the final number", () => {
    const s = setup("PHYSICAL", "DIGITAL", 1, 20);
    expect(buildAttackPreview(s, "player_1", 0, "player_2", 0)).toContain("−25 MP");
  });
});
