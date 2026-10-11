import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module, no type declarations
import { ABILITY_ENERGY_COSTS, ABILITY_IN_EFFECT_ENERGY } from "../../src/rules/abilityEnergyCosts.js";
// @ts-expect-error - JS module, no type declarations
import { getAbilityEnergyCost } from "../../src/engine/energy/getAbilityEnergyCost.js";

const enabled = (MOSJES as any[]).filter((m) => !m.disabled && m.abilityId);

describe("ability Energy costs", () => {
  it("every key is the abilityId of an enabled Mosje", () => {
    const ids = new Set(enabled.map((m) => m.abilityId));
    for (const k of Object.keys(ABILITY_ENERGY_COSTS)) expect(ids.has(k), k).toBe(true);
  });

  it("agrees with every printed 'pay N Energy' text", () => {
    for (const m of enabled) {
      const hit = /\bpay (\d+) Energy/i.exec(m.abilityDescription || "");
      if (!hit || ABILITY_IN_EFFECT_ENERGY.includes(m.abilityId)) continue;
      expect(ABILITY_ENERGY_COSTS[m.abilityId], m.abilityId).toBe(Number(hit[1]));
    }
  });

  it("in-effect Energy abilities are optional or a stake", () => {
    for (const id of ABILITY_IN_EFFECT_ENERGY) {
      const m = enabled.find((x) => x.abilityId === id);
      expect(m, id).toBeTruthy();
      expect(/may pay|stake/i.test(m.abilityDescription), id).toBe(true);
    }
  });

  it("getAbilityEnergyCost looks up and defaults to 0", () => {
    expect(getAbilityEnergyCost("ability_tuk_healer_healing_presence")).toBe(1);
    expect(getAbilityEnergyCost("unknown")).toBe(0);
    expect(getAbilityEnergyCost(undefined)).toBe(0);
  });
});
