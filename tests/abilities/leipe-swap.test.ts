import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { effect_leipe_swap } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error - JS module, no type declarations
import { endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";

function makeSlot(cardId: string, mp: number, level = 1) {
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

function makePlayer(cardId: string, mp: number, level = 1) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    activeSlots: [makeSlot(cardId, mp, level), null],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
  };
}

function makeState() {
  return {
    activePlayerId: "player_1",
    turnNumber: 7,
    status: "PLAYING",
    activePlace: null,
    sharedGeneralQuestDeck: [] as any[],
    sharedGeneralQuestDiscard: [] as any[],
    players: {
      player_1: makePlayer("mosje_coert", 30, 1),
      player_2: makePlayer("mosje_binti", 80, 2),
    },
  } as any;
}

describe("Leipe Swap", () => {
  it("swaps MP between the targeted slots and records the swap-back pair", () => {
    const state = makeState();
    state._pendingTargets = {
      leipeYourSlot: 0,
      leipeOppId: "player_2",
      leipeOppSlot: 0,
    };

    const next = effect_leipe_swap(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(80);
    expect(next.players.player_2.activeSlots[0].mp).toBe(30);
    expect(next._leipeSwap).toEqual({
      byPlayerId: "player_1",
      yourSlotIndex: 0,
      oppId: "player_2",
      oppSlotIndex: 0,
    });
  });

  it("leaves levels unchanged by the swap", () => {
    const state = makeState();
    state._pendingTargets = {
      leipeYourSlot: 0,
      leipeOppId: "player_2",
      leipeOppSlot: 0,
    };

    const next = effect_leipe_swap(state, "player_1");

    expect(next.players.player_1.activeSlots[0].level).toBe(1);
    expect(next.players.player_2.activeSlots[0].level).toBe(2);
  });

  it("is a graceful no-op when no pending targets are set", () => {
    const state = makeState();

    const next = effect_leipe_swap(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(30);
    expect(next.players.player_2.activeSlots[0].mp).toBe(80);
    expect(next._leipeSwap).toBeUndefined();
  });

  it("swaps the current MP back at the end of the swapper's turn and clears the record", () => {
    const state = makeState();
    state.players.player_1.activeSlots[0].mp = 45;
    state.players.player_2.activeSlots[0].mp = 15;
    state._leipeSwap = {
      byPlayerId: "player_1",
      yourSlotIndex: 0,
      oppId: "player_2",
      oppSlotIndex: 0,
    };

    const next = endTurn(state);

    expect(next.players.player_1.activeSlots[0].mp).toBe(15);
    expect(next.players.player_2.activeSlots[0].mp).toBe(45);
    expect(next._leipeSwap).toBeUndefined();
  });

  it("keeps banked levels while swapping current MP back in the worked example", () => {
    const state = makeState();
    state._pendingTargets = {
      leipeYourSlot: 0,
      leipeOppId: "player_2",
      leipeOppSlot: 0,
    };

    const swapped = effect_leipe_swap(state, "player_1");
    swapped.players.player_1.activeSlots[0].level = 2;
    swapped.players.player_1.activeSlots[0].mp = 20;

    const next = endTurn(swapped);

    expect(next.players.player_1.activeSlots[0].level).toBe(2);
    expect(next.players.player_1.activeSlots[0].mp).toBe(30);
    expect(next.players.player_2.activeSlots[0].level).toBe(2);
    expect(next.players.player_2.activeSlots[0].mp).toBe(20);
  });

  it("defines the Leipe Swap card with the locked Phase 20 values", () => {
    const card = PIECIES.find((piecie: any) => piecie.id === "piecie_leipe_swap");

    expect(card).toBeTruthy();
    expect(card.mpCost).toBe(0);
    expect(card.rarity).toBe("★★★★");
    expect(card.effectId).toBe("effect_leipe_swap");
    expect(card.persistUntilEndOfTurn).toBe(true);
  });
});
