import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module, no type declarations
import { ABILITY_ENERGY_COSTS, ABILITY_IN_EFFECT_ENERGY } from "../../src/rules/abilityEnergyCosts.js";
// @ts-expect-error - JS module, no type declarations
import { getAbilityEnergyCost } from "../../src/engine/energy/getAbilityEnergyCost.js";

const enabled = (MOSJES as any[]).filter((m) => !m.disabled && m.abilityId);
// Phase 69: archived Mosjes keep their data (and their Energy cost entry), so a key may belong to one of them.
const known = (MOSJES as any[]).filter((m) => m.abilityId);
// Phase 69: the 2.1 text of these three abilities is ahead of the engine's Energy table.
// Phase 71: effect follows the new text. Remove an id here when its cost entry is updated.
const PHASE_71_TEXT_AHEAD = [
  "ability_gandoe_wizard_chaos_roll", // new: pay 1 Energy, look at the top 3 cards
  "ability_ming_natural_lucky_draw", // new: pay 1 Energy, reveal the top card and draw it
];

describe("ability Energy costs", () => {
  it("every key is the abilityId of a Mosje in the data (enabled or archived)", () => {
    const ids = new Set(known.map((m) => m.abilityId));
    for (const k of Object.keys(ABILITY_ENERGY_COSTS)) expect(ids.has(k), k).toBe(true);
  });

  it("agrees with every printed 'pay N Energy' text", () => {
    for (const m of enabled) {
      const hit = /\bpay (\d+) Energy/i.exec(m.abilityDescription || "");
      if (!hit || ABILITY_IN_EFFECT_ENERGY.includes(m.abilityId) || PHASE_71_TEXT_AHEAD.includes(m.abilityId)) continue;
      expect(ABILITY_ENERGY_COSTS[m.abilityId], m.abilityId).toBe(Number(hit[1]));
    }
  });

  it("in-effect Energy abilities are optional or a stake", () => {
    for (const id of ABILITY_IN_EFFECT_ENERGY) {
      const m = known.find((x) => x.abilityId === id);
      expect(m, id).toBeTruthy();
      if (m.disabled) continue; // archived in 2.1: the data is kept, the text is not checked
      expect(/may pay|stake/i.test(m.abilityDescription), id).toBe(true);
    }
  });

  it("getAbilityEnergyCost looks up and defaults to 0", () => {
    expect(getAbilityEnergyCost("ability_tuk_healer_healing_presence")).toBe(1);
    expect(getAbilityEnergyCost("unknown")).toBe(0);
    expect(getAbilityEnergyCost(undefined)).toBe(0);
  });
});
