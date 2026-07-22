import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnEnd } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";

// ─────────────────────────────────────────────────────────────
// Phase 41 — Coert's Caravan redesign.
// The old end-of-turn drain identity is gone. Caravan is now a passive shield:
// Coert Mosjes ignore up to 40 MP of Quest damage per turn. Quest attempt costs
// remain costs and are not prevented.
// ─────────────────────────────────────────────────────────────

function buildCaravanState(overrides = {}) {
  return createEngineState({
    activePlace: "place_coerts_caravan",
    turnNumber: 7,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_coert_kasteluck",
            name: "Coert KasteLuck",
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

describe("place_coerts_caravan (Phase 41) — Coert Quest-damage shield", () => {
  it("no longer drains Mosjes at end phase", () => {
    const state = buildCaravanState();
    const after = applyPlaceEffectsOnEnd(state);

    expect(after.players.player_1.activeSlots[0].mp).toBe(50);
    expect(after.players.player_1.activeSlots[1].mp).toBe(40);
  });

  it("prevents up to 40 MP of Quest damage to a Coert Mosje each turn", () => {
    const state = buildCaravanState();

    const afterFirst = loseMP(state, "player_1", 0, 30, "QUEST");
    expect(afterFirst.players.player_1.activeSlots[0].mp).toBe(50);
    expect(afterFirst.players.player_1.activeSlots[0]._coertsCaravanQuestShield.used).toBe(30);

    const afterSecond = loseMP(afterFirst, "player_1", 0, 20, "QUEST_ELIMINATION");
    expect(afterSecond.players.player_1.activeSlots[0].mp).toBe(40);
    expect(afterSecond.players.player_1.activeSlots[0]._coertsCaravanQuestShield.used).toBe(40);
  });

  it("does not prevent Quest attempt costs or non-Quest damage", () => {
    const state = buildCaravanState();

    const afterCost = loseMP(state, "player_1", 0, 20, "QUEST_COST");
    expect(afterCost.players.player_1.activeSlots[0].mp).toBe(30);

    const afterDrain = loseMP(state, "player_1", 0, 20, "DRAIN");
    expect(afterDrain.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it("does not shield non-Coert Mosjes from Quest damage", () => {
    const state = buildCaravanState();
    const after = loseMP(state, "player_1", 1, 20, "QUEST");

    expect(after.players.player_1.activeSlots[1].mp).toBe(20);
  });

  it("dispatcher-level proof: END_PHASE no longer reaches the Caravan effect", () => {
    const state = buildCaravanState();
    const after = applyPlaceEffectsOnEnd(state);

    expect(after._lastPlaceEffect?.placeId).not.toBe("place_coerts_caravan");
  });
});
