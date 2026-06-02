import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  ability_ronald_mastermind_master_plan,
  ability_ming_predictor_future_sight,
  ability_tuk_architect_perfect_placement,
} from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// ─────────────────────────────────────────────────────────────
// Phase 18 Plan 02 — dead-flag Mosje ability fixes
// Three Mosje abilities set a peek flag that was never consumed and did the
// WRONG thing vs. their card text:
//   _masterPlanPeek  (Ronald Mastermind) → must instead play a Piecie from discard for free
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
    discard: [] as any[],
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
    sharedGeneralQuestDeck: [] as any[],
    players: {
      player_1: makePlayer(slotCardId, mp),
      player_2: makePlayer("mosje_opponent", 100),
    },
  } as any;
}

// ─────────────────────────────────────────────────────────────
// Ming — Future Sight: pay 10 MP, peek top shared quest, optionally bottom it
// ─────────────────────────────────────────────────────────────
describe("Ming Future Sight — top General Quest peek + optional send-to-bottom", () => {
  it("charges 10 MP and moves the top quest to the bottom when mingSendToBottom is true", () => {
    const state = makeState("mosje_ming_predictor", 50);
    state.sharedGeneralQuestDeck = [
      { cardId: "quest_a" },
      { cardId: "quest_b" },
      { cardId: "quest_c" },
    ];
    state._pendingTargets = { mingSendToBottom: true };

    const next = ability_ming_predictor_future_sight(state, "player_1");

    // 10 MP charged
    expect(next.players.player_1.activeSlots[0].mp).toBe(40);
    // top moved to bottom
    expect(next.sharedGeneralQuestDeck.map((c: any) => c.cardId)).toEqual([
      "quest_b",
      "quest_c",
      "quest_a",
    ]);
  });

  it("charges 10 MP but leaves quest order unchanged when mingSendToBottom is false", () => {
    const state = makeState("mosje_ming_predictor", 50);
    state.sharedGeneralQuestDeck = [
      { cardId: "quest_a" },
      { cardId: "quest_b" },
    ];
    state._pendingTargets = { mingSendToBottom: false };

    const next = ability_ming_predictor_future_sight(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(40);
    expect(next.sharedGeneralQuestDeck.map((c: any) => c.cardId)).toEqual([
      "quest_a",
      "quest_b",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────
// Tuk — Perfect Placement: pay 15 MP, peek top 5, take 2 to hand, bottom 3
// ─────────────────────────────────────────────────────────────
describe("Tuk Perfect Placement — peek 5, take 2 to hand, bottom 3", () => {
  it("charges 15 MP, moves 2 chosen cards to hand, bottoms the other 3 of the top 5", () => {
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
    expect(next.players.player_1.activeSlots[0].mp).toBe(35);
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
// Ronald — Master Plan: play a Piecie from discard for free, resolve it,
// persist if persistUntilEndOfTurn else send to discard; once per game.
// ─────────────────────────────────────────────────────────────
describe("Ronald Master Plan — play a Piecie from discard for free", () => {
  it("plays a non-persistent Piecie from discard (removed from discard, effect ran), sets masterPlanUsed", () => {
    const state = makeState("mosje_ronald_mastermind", 50);
    // kannetje_melk has NO persistUntilEndOfTurn; its effect grants +25 MP to the active Mosje
    state.players.player_1.discard = [{ cardId: "piecie_kannetje_melk" }];
    state._pendingTargets = { masterPlanCardId: "piecie_kannetje_melk" };

    const next = ability_ronald_mastermind_master_plan(state, "player_1");

    // Effect ran: Ronald (active Mosje) gained 25 MP (50 → 75)
    expect(next.players.player_1.activeSlots[0].mp).toBe(75);
    // once-per-game flag set
    expect(next.players.player_1.activeSlots[0].masterPlanUsed).toBe(true);
    // non-persistent → ends in discard, NOT on the field
    expect(
      next.players.player_1.discard.some((c: any) => (c.cardId ?? c) === "piecie_kannetje_melk")
    ).toBe(true);
    expect(
      next.players.player_1.piecieSlots.some(
        (s: any) => s && s.cardId === "piecie_kannetje_melk"
      )
    ).toBe(false);
  });

  it("keeps a persistUntilEndOfTurn Piecie on the field after playing it", () => {
    const state = makeState("mosje_ronald_mastermind", 50);
    // redbull HAS persistUntilEndOfTurn true
    state.players.player_1.discard = [{ cardId: "piecie_redbull" }];
    state._pendingTargets = { masterPlanCardId: "piecie_redbull" };

    const next = ability_ronald_mastermind_master_plan(state, "player_1");

    // landed in a piecie slot with persistUntilEoT true
    const placed = next.players.player_1.piecieSlots.find(
      (s: any) => s && s.cardId === "piecie_redbull"
    );
    expect(placed).toBeTruthy();
    expect(placed.persistUntilEoT).toBe(true);
    // removed from discard
    expect(
      next.players.player_1.discard.some((c: any) => (c.cardId ?? c) === "piecie_redbull")
    ).toBe(false);
    expect(next.players.player_1.activeSlots[0].masterPlanUsed).toBe(true);
  });

  it("throws when masterPlanUsed is already true", () => {
    const state = makeState("mosje_ronald_mastermind", 50);
    state.players.player_1.activeSlots[0].masterPlanUsed = true;
    state.players.player_1.discard = [{ cardId: "piecie_kannetje_melk" }];
    state._pendingTargets = { masterPlanCardId: "piecie_kannetje_melk" };

    expect(() => ability_ronald_mastermind_master_plan(state, "player_1")).toThrow();
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
