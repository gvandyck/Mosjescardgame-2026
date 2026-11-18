// 2.0 Binti holder text (Phase 58-01): "While Coert, The Hawaiian Tech Savant is also on your field:
// every food Piecie you activate gives its Mosje +10 MP extra." Replaces the V4 FOOD double
// (and the 2026-07-12 "all Coert variants" ruling): only Coert Tech is Binti's partner now.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { isHolderTextActive } from "../../src/engine/synergy/isHolderTextActive.js";
// @ts-expect-error - JS module, no type declarations
import { effect_kannetje_melk } from "../../src/abilities/piecieEffects.js";

function makeSlot(cardId: string, mp = 50) {
  return {
    cardId, name: cardId, subtype: "CREATIVE", traits: {}, mp, level: 1,
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

// Phase 71-14: Binti, The Sharp Tongue no longer has a Coert synergy; her food +10 is gone.
describe("Binti + Coert Tech: no holder text any more", () => {
  it("Binti + Coert Tech is not live", () => {
    const state = makeState([makeSlot("mosje_binti"), makeSlot("mosje_coert_tech")]);
    expect(isHolderTextActive(state, "player_1", "mosje_binti")).toBe(false);
  });

  it("Kannetje Melk gives its printed 25 with Binti + Coert Tech", () => {
    const state = makeState([makeSlot("mosje_binti", 20), makeSlot("mosje_coert_tech")]);
    const out = effect_kannetje_melk(state, "player_1");
    expect(out.players.player_1.activeSlots[0].mp).toBe(45);
  });

  it("Kannetje Melk stays at base 25 without Coert Tech", () => {
    const state = makeState([makeSlot("mosje_binti", 20), null]);
    const out = effect_kannetje_melk(state, "player_1");
    expect(out.players.player_1.activeSlots[0].mp).toBe(45);
  });
});
