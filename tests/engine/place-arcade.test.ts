import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnQuest } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-02 (PLACE-03) — Arcade reconciliation
// First-slot-only bug: effect_arcade only ever touched the first active slot
// instead of every Technical ★★+ Mosje on the questing player's field.
// These tests go through the REAL ON_QUEST dispatch path
// (applyPlaceEffectsOnQuest → resolvePlaceEffect) rather than calling
// effect_arcade directly.
// ─────────────────────────────────────────────────────────────

function buildArcadeState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_arcade",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Technical Mosje A",
            traits: { technical: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_b",
            name: "Technical Mosje B",
            traits: { technical: 3 },
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

function buildMixedTechnicalState() {
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    activePlace: "place_arcade",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_technical",
            name: "Technical Mosje",
            traits: { technical: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          {
            cardId: "mosje_nontechnical",
            name: "Non-Technical Mosje",
            traits: { technical: 1 },
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

describe("Arcade — On Quest (dispatcher-level, PLACE-03)", () => {
  it("BOTH Technical ★★+ Mosjes gain +15 MP on success (not just the first slot)", () => {
    const state = buildArcadeState();

    const next = applyPlaceEffectsOnQuest(state, "player_1", { cardId: "quest_x" }, true, 0);

    const [slotA, slotB] = next.players.player_1.activeSlots;
    expect(slotA.mp).toBe(20 + 15);
    expect(slotB.mp).toBe(30 + 15);
  });

  it("neither Mosje gains anything when the quest fails", () => {
    const state = buildArcadeState();

    const next = applyPlaceEffectsOnQuest(state, "player_1", { cardId: "quest_x" }, false, 0);

    const [slotA, slotB] = next.players.player_1.activeSlots;
    expect(slotA.mp).toBe(20);
    expect(slotB.mp).toBe(30);
  });

  it("a Mosje with technical < 2 is unaffected even on success", () => {
    const state = buildMixedTechnicalState();

    const next = applyPlaceEffectsOnQuest(state, "player_1", { cardId: "quest_x" }, true, 0);

    const [technical, nonTechnical] = next.players.player_1.activeSlots;
    expect(technical.mp).toBe(20 + 15);
    expect(nonTechnical.mp).toBe(20);
  });
});
