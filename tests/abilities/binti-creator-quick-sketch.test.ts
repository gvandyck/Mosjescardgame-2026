import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_binti_creator_quick_sketch } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// 2026-06-17 reconciliation: Binti Creator "Quick Sketch" was a stub (draw 1). Reworked
// to match its card text: discard 2 FOOD Piecies from hand, then tutor any 1 card from
// the deck into hand. Discards + tutor target arrive via _pendingTargets.

function bintiState(): any {
  const state = createEngineState({
    players: {
      player_1: {
        activeSlots: [
          { cardId: "mosje_binti_creator", name: "[Binti] The Creator", mp: 60, level: 1,
            isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
          null,
        ],
      },
    },
  });
  state.players.player_1.hand = [
    { cardId: "piecie_varkenspootjes" },   // FOOD
    { cardId: "piecie_varkenspootjes" },   // FOOD (duplicate id — must still discard both)
    { cardId: "piecie_kannetje_melk" },    // non-FOOD filler
  ];
  state.players.player_1.deck = [{ cardId: "piecie_pot_of_weed" }, { cardId: "snelle_jensen" }];
  state.players.player_1.graveyard = [];
  return state;
}

describe("Binti Creator — Quick Sketch (discard 2 FOOD → tutor 1 from deck)", () => {
  it("discards both chosen FOOD cards and pulls the chosen card from deck to hand", () => {
    const state = bintiState();
    state._pendingTargets = {
      bintiCreatorDiscard: ["piecie_varkenspootjes", "piecie_varkenspootjes"],
      bintiCreatorTutor: "piecie_pot_of_weed",
    };
    const next = ability_binti_creator_quick_sketch(state, "player_1");

    const handIds = next.players.player_1.hand.map((c: any) => c.cardId ?? c);
    expect(handIds).toContain("piecie_pot_of_weed");          // fetched into hand
    expect(handIds).not.toContain("piecie_varkenspootjes");   // both FOOD discarded
    expect(handIds).toContain("piecie_kannetje_melk");        // filler untouched
    expect(next.players.player_1.graveyard.length).toBe(2);   // 2 discarded
    const deckIds = next.players.player_1.deck.map((c: any) => c.cardId ?? c);
    expect(deckIds).toEqual(["snelle_jensen"]);               // tutor removed from deck
    expect(next._pendingTargets?.bintiCreatorTutor).toBeUndefined(); // consumed
  });

  it("throws if fewer than 2 cards are chosen to discard", () => {
    const state = bintiState();
    state._pendingTargets = { bintiCreatorDiscard: ["piecie_varkenspootjes"], bintiCreatorTutor: "piecie_pot_of_weed" };
    expect(() => ability_binti_creator_quick_sketch(state, "player_1")).toThrow();
  });

  it("throws if no deck card is chosen to fetch", () => {
    const state = bintiState();
    state._pendingTargets = { bintiCreatorDiscard: ["piecie_varkenspootjes", "piecie_varkenspootjes"] };
    expect(() => ability_binti_creator_quick_sketch(state, "player_1")).toThrow();
  });
});
