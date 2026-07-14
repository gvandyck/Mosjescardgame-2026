// FOOD-double synergy: ALL Coert variants count (2026-07-12 ruling).
// hasFoodDoubleSynergy previously only checked Binti + Coert Tech, while
// Binti's synergyWith (and card text) claims all three Coerts. Now every
// Coert variant on the field alongside Binti doubles FOOD Piecie MP.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { hasFoodDoubleSynergy } from "../../src/engine/synergyResolver.js";
// @ts-expect-error - JS module, no type declarations
import { effect_kannetje_melk } from "../../src/abilities/piecieEffects.js";

function makeSlot(cardId: string, mp = 50) {
  return {
    cardId, name: cardId, subtype: "ARTISTIC", traits: {}, mp, level: 0,
    isDefeated: false, statusEffects: [] as any[], abilityUsedThisTurn: false,
  };
}
function makeState(p1Mosjes: (ReturnType<typeof makeSlot> | null)[]) {
  return {
    status: "ACTIVE", activePlayerId: "player_1", turnNumber: 3,
    players: {
      player_1: { name: "P1", hand: [], deck: [], graveyard: [], activeSlots: p1Mosjes, piecieSlots: [null, null, null, null] },
      player_2: { name: "P2", hand: [], deck: [], graveyard: [], activeSlots: [makeSlot("mosje_jisca"), null], piecieSlots: [null, null, null, null] },
    },
  } as any;
}

describe("FOOD-double synergy — all Coert variants count", () => {
  it.each([
    "mosje_coert_tech",
    "mosje_coert_kasteluck",
    "mosje_coert_kastelein",
  ])("Binti + %s activates the FOOD double", (coertId) => {
    const state = makeState([makeSlot("mosje_binti"), makeSlot(coertId)]);
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(true);
  });

  it("Binti alone does NOT activate it", () => {
    const state = makeState([makeSlot("mosje_binti"), null]);
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(false);
  });

  it("a Coert alone does NOT activate it", () => {
    const state = makeState([makeSlot("mosje_coert_kasteluck"), null]);
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(false);
  });

  it("a defeated Coert does NOT activate it", () => {
    const deadCoert = { ...makeSlot("mosje_coert_kastelein"), isDefeated: true };
    const state = makeState([makeSlot("mosje_binti"), deadCoert]);
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(false);
  });

  it("Kannetje Melk pays out doubled (50 instead of 25) with Binti + Coert KasteLuck", () => {
    const state = makeState([makeSlot("mosje_binti", 20), makeSlot("mosje_coert_kasteluck")]);
    const out = effect_kannetje_melk(state, "player_1");
    expect(out.players.player_1.activeSlots[0].mp).toBe(70); // 20 + 50 doubled
  });

  it("Kannetje Melk stays at base 25 without a Coert", () => {
    const state = makeState([makeSlot("mosje_binti", 20), null]);
    const out = effect_kannetje_melk(state, "player_1");
    expect(out.players.player_1.activeSlots[0].mp).toBe(45); // 20 + 25 base
  });
});
