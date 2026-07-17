import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnEnd } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-04 (PLACE-08) — Coert's Caravan reconciliation
// Old behavior used the same dead "TURN_START" trigger as Bank Chilling
// (never fired in live play) and granted a "free Piecie activation" flag
// that had no working consumer. Replaced entirely per the locked ruling:
// End of Turn, all Mosjes lose 10 MP; Coert-family Mosjes are immune.
// These tests go through the REAL END_PHASE dispatch path
// (applyPlaceEffectsOnEnd → resolvePlaceEffect), not effect_coerts_caravan
// directly.
// ─────────────────────────────────────────────────────────────

function buildCaravanState(overrides = {}) {
  return createEngineState({
    activePlace: "place_coerts_caravan",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Non-Coert Mosje A",
            traits: {},
            mp: 50,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_b",
            name: "Non-Coert Mosje B",
            traits: {},
            mp: 40,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
        ],
      },
      player_2: { activeSlots: [] },
    },
    ...overrides,
  });
}

describe("place_coerts_caravan (PLACE-08) — end-of-turn drain, Coert immune", () => {
  it("drains 10 MP from every non-Coert active Mosje via the real END_PHASE dispatch", () => {
    const state = buildCaravanState();
    const after = applyPlaceEffectsOnEnd(state);

    expect(after.players.player_1.activeSlots[0].mp).toBe(40);
    expect(after.players.player_1.activeSlots[1].mp).toBe(30);
  });

  it("a Coert-family Mosje is immune while a non-Coert Mosje on the same field still loses 10", () => {
    const state = createEngineState({
      activePlace: "place_coerts_caravan",
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: "mosje_coert_tech",
              name: "Coert Tech",
              traits: {},
              mp: 60,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: "mosje_b",
              name: "Non-Coert Mosje B",
              traits: {},
              mp: 40,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    const after = applyPlaceEffectsOnEnd(state);

    expect(after.players.player_1.activeSlots[0].mp).toBe(60);
    expect(after.players.player_1.activeSlots[1].mp).toBe(30);
  });

  it("dispatcher-level proof: _lastPlaceEffect.placeId reflects the real dispatch reaching the effect", () => {
    const state = buildCaravanState();
    const after = applyPlaceEffectsOnEnd(state);

    expect(after._lastPlaceEffect.placeId).toBe("place_coerts_caravan");
  });
});
