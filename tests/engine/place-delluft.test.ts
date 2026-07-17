import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnEnd } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-03 (PLACE-07) — Delluft regression test
// Delluft's draw-1 behavior already matched its card text and had zero
// existing test coverage (a Wave-0 gap). This test closes that gap by
// going through the REAL dispatch path (applyPlaceEffectsOnEnd, called
// from endTurn), not a direct call to effect_delluft — no behavior
// change in this plan.
// ─────────────────────────────────────────────────────────────

function buildDelluftState() {
  return createEngineState({
    activePlace: "place_delluft",
    players: {
      player_1: {
        hand: [],
        deck: [{ cardId: "piecie_a", type: "PIECIE" }],
        activeSlots: [],
      },
      player_2: {
        hand: [],
        deck: [{ cardId: "piecie_b", type: "PIECIE" }],
        activeSlots: [],
      },
    },
  });
}

describe("place_delluft (PLACE-07) — draw-1 dispatcher-level regression", () => {
  it("both players draw exactly 1 card via the END_PHASE dispatch", () => {
    const state = buildDelluftState();
    const after = applyPlaceEffectsOnEnd(state);

    expect(after.players.player_1.hand.length).toBe(1);
    expect(after.players.player_1.deck.length).toBe(0);
    expect(after.players.player_2.hand.length).toBe(1);
    expect(after.players.player_2.deck.length).toBe(0);
  });
});
