import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_martin_senor_west_calculated_guess } from "../../src/abilities/mosjeAbilities.js";

function makeState(overrides: {
  guess?: string;
  topCardType?: string;
  deckCards?: Array<{ cardId: string; type: string }>;
  mp?: number;
  level?: number;
}) {
  const { guess, topCardType, deckCards = [], mp = 30, level = 0 } = overrides;
  return {
    _pendingTargets: guess && topCardType
      ? { west_guess: guess, west_top_card_type: topCardType }
      : undefined,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_martin_senor_west",
            name: "West",
            mp,
            level,
            isDefeated: false,
            traits: { mental: 3 },
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        deck: [...deckCards],
        hand: [],
        discard: [],
      },
    },
  };
}

describe("West — Calculated Guess", () => {
  it("correct guess: gains 10 MP", () => {
    const state = makeState({ guess: "PIECIE", topCardType: "PIECIE", mp: 30 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
  });

  it("correct guess: draws 2 cards from deck", () => {
    const deck = [
      { cardId: "card_a", type: "PIECIE" },
      { cardId: "card_b", type: "PIECIE" },
      { cardId: "card_c", type: "MOSJE" },
    ];
    const state = makeState({ guess: "PIECIE", topCardType: "PIECIE", deckCards: deck });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.hand).toHaveLength(2);
    expect(result.players.player_1.deck).toHaveLength(1);
  });

  it("wrong guess: loses 10 MP", () => {
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", mp: 30 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(20);
  });

  it("wrong guess: draws no cards", () => {
    const deck = [{ cardId: "card_a", type: "PIECIE" }];
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", deckCards: deck });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.hand).toHaveLength(0);
    expect(result.players.player_1.deck).toHaveLength(1);
  });

  it("wrong guess: revealed card stays on top of deck", () => {
    const deck = [
      { cardId: "top_card", type: "PIECIE" },
      { cardId: "second_card", type: "MOSJE" },
    ];
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", deckCards: deck });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.deck[0].cardId).toBe("top_card");
  });

  it("no effect when _pendingTargets is missing", () => {
    const state = makeState({ mp: 30 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(30);
    expect(result.players.player_1.hand).toHaveLength(0);
  });
});

describe("West — MP floor behavior (BUG-03)", () => {
  it("wrong guess at mp=0, level=0: mp stays at 0 (floor clamp)", () => {
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", mp: 0, level: 0 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
    expect(result.players.player_1.activeSlots[0].level).toBe(0);
  });

  it("wrong guess at mp=0, level=1: triggers level regression", () => {
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", mp: 0, level: 1 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].level).toBe(0);
    expect(result.players.player_1.activeSlots[0].mp).toBeGreaterThanOrEqual(0);
  });

  it("wrong guess at mp=5, level=0: mp clamps to 0 not -5", () => {
    const state = makeState({ guess: "MOSJE", topCardType: "PIECIE", mp: 5, level: 0 });
    const result = ability_martin_senor_west_calculated_guess(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(0);
  });
});
