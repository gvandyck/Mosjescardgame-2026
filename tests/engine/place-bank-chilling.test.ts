import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-01 (PLACE-01) — Bank Chilling reconciliation
// Two bugs fixed together:
//  1. Dead-dispatch: places.js trigger was "TURN_START", a string no call
//     site in src/ ever passes — the effect NEVER fired in live play.
//     Fixed to "START_PHASE" (the string applyPlaceEffectsOnStart uses).
//  2. First-slot-only: effect_bank_chilling only ever touched the first
//     active slot instead of every Social ★★+ Mosje on the field.
// These tests go through the REAL startTurn dispatch path (not a direct
// call to effect_bank_chilling) so a regression back to "TURN_START" would
// make them fail — closing the Wave-0 test gap called out in RESEARCH.md.
// ─────────────────────────────────────────────────────────────

function buildBankChillingState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_bank_chilling",
    players: {
      player_1: {
        hand: [],
        deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }],
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Social Mosje A",
            traits: { social: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_b",
            name: "Social Mosje B",
            traits: { social: 3 },
            mp: 30,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
        ],
        piecieSlots: [null, null, null, null, null],
      },
    },
  });
}

function buildMixedSocialState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_bank_chilling",
    players: {
      player_1: {
        hand: [],
        deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }],
        activeSlots: [
          {
            cardId: "mosje_social",
            name: "Social Mosje",
            traits: { social: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_nonsocial",
            name: "Non-Social Mosje",
            traits: { social: 1 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
        ],
        piecieSlots: [null, null, null, null, null],
      },
    },
  });
}

describe("Bank Chilling — Turn Start (dispatcher-level, PLACE-01)", () => {
  it("BOTH Social ★★+ Mosjes gain +15 MP via the real startTurn dispatch (not just the first slot)", () => {
    const state = buildBankChillingState();

    const next = startTurn(state);

    const [slotA, slotB] = next.players.player_1.activeSlots;
    // +20 turn trickle already applies to every active slot; Bank Chilling adds +15 on top.
    expect(slotA.mp).toBe(20 + 10 + 15);
    expect(slotB.mp).toBe(30 + 10 + 15);
  });

  it("proves the dispatcher actually reached effect_bank_chilling (closes the dead-dispatch bug)", () => {
    const state = buildBankChillingState();

    const next = startTurn(state);

    expect(next._lastPlaceEffect).toBeDefined();
    expect(next._lastPlaceEffect.placeId).toBe("place_bank_chilling");
  });

  it("a Mosje with social < 2 does NOT gain the +15 bonus", () => {
    const state = buildMixedSocialState();

    const next = startTurn(state);

    const [social, nonSocial] = next.players.player_1.activeSlots;
    expect(social.mp).toBe(20 + 10 + 15);
    expect(nonSocial.mp).toBe(20 + 10); // trickle only, no Bank Chilling bonus
  });
});
