import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { MOSJE_ABILITY_RULES } from "../../src/rules/mosjeAbilityRules.js";
// @ts-expect-error - JS module
import { ABILITY_ENERGY_COSTS, ABILITY_IN_EFFECT_ENERGY } from "../../src/rules/abilityEnergyCosts.js";
// @ts-expect-error - JS module
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module
import { rollDie } from "../../src/engine/deckEngine.js";
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice } from "../../src/engine/dice/testDiceQueue.js";

const HIDDEN = ["mosje_amplifier", "mosje_coert_kastelein", "mosje_binti_creator"];
const ids2 = MOSJES.filter((m: any) => !HIDDEN.includes(m.id)).map((m: any) => m.abilityId);
const KINDS = ["ownMosje", "oppMosje", "anyMosje", "number", "choice", "handCard", "oppHandCard", "discardCard", "ownPiecieSlot", "questStack", "deckOwner", "orderTopN", "pickFromTopN", "confirm"];

describe("MOSJE_ABILITY_RULES", () => {
  it("has exactly one entry per 2.0 Mosje ability (32)", () => {
    expect(ids2.length).toBe(32);
    expect(Object.keys(MOSJE_ABILITY_RULES).sort()).toEqual([...ids2].sort());
  });
  it("every paid ability is an activated entry", () => {
    for (const id of Object.keys(ABILITY_ENERGY_COSTS)) expect(MOSJE_ABILITY_RULES[id].kind).toBe("activated");
    for (const id of ABILITY_IN_EFFECT_ENERGY) expect(MOSJE_ABILITY_RULES[id].kind).toBe("activated");
  });
  it("special limits and timing", () => {
    expect(MOSJE_ABILITY_RULES.ability_gandoe_destroyer_elimination_strike.per).toBe("game");
    expect(MOSJE_ABILITY_RULES.ability_coert_tech_extra_resources.maxPerTurn).toBe(2);
    expect(MOSJE_ABILITY_RULES.ability_dj_8020_lucky_beats.ownTurnOnly).toBe(false);
    const others = Object.entries(MOSJE_ABILITY_RULES).filter(([id, r]: any) => r.kind === "activated" && id !== "ability_dj_8020_lucky_beats");
    for (const [, r] of others as any) expect(r.ownTurnOnly).toBe(true);
  });
  it("uses only known input kinds", () => {
    for (const r of Object.values(MOSJE_ABILITY_RULES) as any[]) {
      expect(["activated", "trigger", "passive"]).toContain(r.kind);
      for (const i of r.inputs) expect(KINDS).toContain(i.kind);
      if (r.kind !== "activated") expect(r.inputs).toEqual([]);
    }
  });
});

describe("test dice queue", () => {
  it("serves queued values first, then Math.random", () => {
    pushTestDice([3, 6]);
    expect(rollDie(6)).toBe(3);
    expect(rollDie(6)).toBe(6);
    const r = rollDie(6);
    expect(r).toBeGreaterThanOrEqual(1);
    expect(r).toBeLessThanOrEqual(6);
    clearTestDice();
  });
});
