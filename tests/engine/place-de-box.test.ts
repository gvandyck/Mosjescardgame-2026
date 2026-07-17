import { describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnEnd } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-02 (PLACE-04) — De Box reconciliation
// Two bugs fixed together:
//  1. Narrow substring match: effect_de_box's bonus branch only matched
//     `id.includes('michelle')`, so Tuk-family Mosjes (mosje_tuk_healer,
//     mosje_tuk_architect) never triggered the +15 MICHELLE/TUK bonus even
//     though the card's own description already promised "MICHELLE/TUK".
//  2. Cosmetic copy-paste bug: all 3 console.log lines said "Toennoe" (a
//     different Place's retired name) instead of "De Box".
// These tests go through the REAL END_PHASE dispatch path
// (applyPlaceEffectsOnEnd → resolvePlaceEffect) rather than calling
// effect_de_box directly.
// ─────────────────────────────────────────────────────────────

function buildLoneTukState(tukCardId: string) {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_de_box",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: tukCardId,
            name: "Tuk-family Mosje",
            traits: {},
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
      },
    },
  });
}

function buildGandoeAndTukTogetherState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_de_box",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_gandoe_destroyer",
            name: "Gandoe Destroyer",
            traits: {},
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_tuk_architect",
            name: "Tuk Architect",
            traits: {},
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
        ],
      },
    },
  });
}

describe("De Box — End Phase (dispatcher-level, PLACE-04)", () => {
  it("a lone mosje_tuk_healer gains +15 MP (previously only mosje_michelle matched)", () => {
    const state = buildLoneTukState("mosje_tuk_healer");

    const next = applyPlaceEffectsOnEnd(state);

    const [tukSlot] = next.players.player_1.activeSlots;
    expect(tukSlot.mp).toBe(20 + 15);
  });

  it("a lone mosje_tuk_architect gains +15 MP (previously only mosje_michelle matched)", () => {
    const state = buildLoneTukState("mosje_tuk_architect");

    const next = applyPlaceEffectsOnEnd(state);

    const [tukSlot] = next.players.player_1.activeSlots;
    expect(tukSlot.mp).toBe(20 + 15);
  });

  it("Gandoe + Tuk together both get the +10 together-bonus on top of their base amounts", () => {
    const state = buildGandoeAndTukTogetherState();

    const next = applyPlaceEffectsOnEnd(state);

    const [gandoeSlot, tukSlot] = next.players.player_1.activeSlots;
    expect(gandoeSlot.mp).toBe(20 + 20 + 10); // base +20, together bonus +10
    expect(tukSlot.mp).toBe(20 + 15 + 10); // base +15, together bonus +10
  });

  it("log output no longer contains the stale 'Toennoe' string for this card's effect", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const state = buildGandoeAndTukTogetherState();

    applyPlaceEffectsOnEnd(state);

    const loggedToennoe = logSpy.mock.calls.some((call) =>
      call.some((arg) => typeof arg === "string" && arg.includes("Toennoe"))
    );
    expect(loggedToennoe).toBe(false);

    logSpy.mockRestore();
  });
});
