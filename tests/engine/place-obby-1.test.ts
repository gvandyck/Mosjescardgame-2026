import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnQuest } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-01 (PLACE-02) — Obby #1 reconciliation
// First-slot-only bug: effect_obby_1 only ever touched the first active slot
// instead of every Physical ★★+/Resilient ★★+ Mosje on the questing player's
// field. These tests go through the REAL ON_QUEST dispatch path
// (applyPlaceEffectsOnQuest → resolvePlaceEffect) rather than calling
// effect_obby_1 directly.
// ─────────────────────────────────────────────────────────────

function buildObbyState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_obby_1",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Physical Mosje A",
            traits: { physical: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_b",
            name: "Resilient Mosje B",
            traits: { resilient: 2 },
            mp: 30,
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

function buildMixedTraitState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_obby_1",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_physical",
            name: "Physical Mosje",
            traits: { physical: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_neither",
            name: "Neither Mosje",
            traits: { physical: 1, resilient: 1 },
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

describe("Obby #1 — On Quest (dispatcher-level, PLACE-02)", () => {
  it("BOTH Physical ★★+/Resilient ★★+ Mosjes gain +20 MP on success (not just the first slot)", () => {
    const state = buildObbyState();

    const next = applyPlaceEffectsOnQuest(state, "player_1", { cardId: "quest_x" }, true, 0);

    const [slotA, slotB] = next.players.player_1.activeSlots;
    expect(slotA.mp).toBe(20 + 20);
    expect(slotB.mp).toBe(30 + 20);
  });

  it("BOTH qualifying Mosjes lose 10 MP on failure (via applyDamage, MP floor respected)", () => {
    const state = buildObbyState();

    const next = applyPlaceEffectsOnQuest(state, "player_1", { cardId: "quest_x" }, false, 0);

    const [slotA, slotB] = next.players.player_1.activeSlots;
    expect(slotA.mp).toBe(20 - 10);
    expect(slotB.mp).toBe(30 - 10);
  });

  it("a Mosje with physical < 2 AND resilient < 2 is unaffected by either branch", () => {
    const successState = buildMixedTraitState();
    const successNext = applyPlaceEffectsOnQuest(successState, "player_1", { cardId: "quest_x" }, true, 0);
    const [physicalSuccess, neitherSuccess] = successNext.players.player_1.activeSlots;
    expect(physicalSuccess.mp).toBe(20 + 20);
    expect(neitherSuccess.mp).toBe(20);

    const failState = buildMixedTraitState();
    const failNext = applyPlaceEffectsOnQuest(failState, "player_1", { cardId: "quest_x" }, false, 0);
    const [physicalFail, neitherFail] = failNext.players.player_1.activeSlots;
    expect(physicalFail.mp).toBe(20 - 10);
    expect(neitherFail.mp).toBe(20);
  });
});
