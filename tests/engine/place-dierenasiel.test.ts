import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { effect_dierenasiel } from "../../src/abilities/placeEffects.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import { PLACES } from "../../src/data/places.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-03 (PLACE-06) — Dierenasiel reconciliation
// The card's +25% PET-protection clause was permanently dead code: the
// setter wrote `state.dienasielActive` (missing the "r") while every
// reader checked the correctly-spelled `state.dierenasielActive` — the
// two never matched. The ruling drops the clause entirely (not just the
// typo) — this plan removes the setter and both dead readers.
// The card's "PET Piecies cost 0 MP" clause is unaffected and deferred
// to Phase 36 (game-wide MP cost model redesign).
// ─────────────────────────────────────────────────────────────

describe("place_dierenasiel (PLACE-06) — dead +25% clause removed", () => {
  it("effect_dierenasiel no longer sets a *ierenasielActive flag on the returned state", () => {
    const state = createEngineState({ activePlace: "place_dierenasiel" });
    const after = effect_dierenasiel(state);
    expect(after.dienasielActive).toBeUndefined();
    expect(after.dierenasielActive).toBeUndefined();
  });

  it("loseMP applies the full loss amount even when dierenasielActive is manually set true", () => {
    const state = createEngineState({
      activePlayerId: "player_1",
      players: {
        player_1: {
          hand: [],
          deck: [],
          activeSlots: [
            {
              cardId: "mosje_a",
              name: "Mosje A",
              traits: {},
              mp: 100,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { hand: [], deck: [], activeSlots: [] },
      },
    });
    state.dierenasielActive = true;

    const after = loseMP(state, "player_1", 0, 20, "DRAIN");
    expect(after.players.player_1.activeSlots[0].mp).toBe(80);
  });

  it("place_dierenasiel.description no longer promises the removed +25% clause", () => {
    const place = PLACES.find((p: any) => p.id === "place_dierenasiel");
    expect(place.description).not.toContain("25%");
    expect(place.description).not.toContain("protection bonuses");
  });
});
