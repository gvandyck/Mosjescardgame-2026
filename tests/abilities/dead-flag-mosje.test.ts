import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  ability_tuk_architect_perfect_placement,
} from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// ─────────────────────────────────────────────────────────────
// Phase 18 Plan 02 — dead-flag Mosje ability fixes
// Three Mosje abilities set a peek flag that was never consumed and did the
// WRONG thing vs. their card text:
//   _masterPlanPeek  (Ronald Mastermind) → must instead play a Piecie from graveyard for free
//   _mingPredictorPeek (Ming Future Sight) → must instead peek the shared quest deck + optional bottom
//   _architectPeek   (Tuk Architect)      → must instead peek top 5, take 2 to hand, bottom 3
// Selections are supplied via state._pendingTargets (same pattern as West/Binti).
// ─────────────────────────────────────────────────────────────

function makeSlot(cardId: string, mp = 100, level = 1) {
  return {
    cardId,
    name: cardId,
    mp,
    level,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makePlayer(slotCardId: string, mp = 100) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    graveyard: [] as any[],
    activeSlots: [makeSlot(slotCardId, mp), null],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
  };
}

function makeState(slotCardId: string, mp = 100) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: makePlayer(slotCardId, mp),
      player_2: makePlayer("mosje_opponent", 100),
    },
  } as any;
}

// Ming Future Sight (stack choice, 1 Energy) and Ronald Master Plan (free activation from discard, 2 Energy, once per turn)
// are covered in tests/abilities/mosjes-rest-b.test.ts (Card List 2.0).

// ─────────────────────────────────────────────────────────────
// Tuk — Perfect Placement: pay 15 MP, peek top 5, take 2 to hand, bottom 3
// ─────────────────────────────────────────────────────────────
describe("Tuk Perfect Placement — peek 5, take 2 to hand, bottom 3", () => {
  it("2.0: spends no MP, moves 2 chosen cards to hand, bottoms the other 3 of the top 5", () => {
    const state = makeState("mosje_tuk_architect", 50);
    state.players.player_1.deck = [
      { cardId: "c1" },
      { cardId: "c2" },
      { cardId: "c3" },
      { cardId: "c4" },
      { cardId: "c5" },
      { cardId: "c6" }, // 6th stays put (not in top 5)
    ];
    state._pendingTargets = { tukChosenCardIds: ["c2", "c4"] };

    const next = ability_tuk_architect_perfect_placement(state, "player_1");

    // 15 MP charged
    expect(next.players.player_1.activeSlots[0].mp).toBe(50); // 2.0: 1 Energy via useMosjeAbility, never MP
    // chosen 2 in hand
    expect(next.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["c2", "c4"]);
    // deck = original rest (c6) followed by the 3 bottomed (c1, c3, c5)
    expect(next.players.player_1.deck.map((c: any) => c.cardId)).toEqual([
      "c6",
      "c1",
      "c3",
      "c5",
    ]);
  });

  it("throws when no selection is provided", () => {
    const state = makeState("mosje_tuk_architect", 50);
    state.players.player_1.deck = [
      { cardId: "c1" },
      { cardId: "c2" },
      { cardId: "c3" },
      { cardId: "c4" },
      { cardId: "c5" },
    ];
    state._pendingTargets = {};

    expect(() => ability_tuk_architect_perfect_placement(state, "player_1")).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Tuk description no longer promises the face-down free-placement clause
// ─────────────────────────────────────────────────────────────
describe("Tuk Architect ability description", () => {
  it("does NOT contain 'face-down'", () => {
    const tuk = MOSJES.find((m: any) => m.id === "mosje_tuk_architect");
    expect(tuk).toBeTruthy();
    expect(tuk.abilityDescription.toLowerCase()).not.toContain("face-down");
  });
});
