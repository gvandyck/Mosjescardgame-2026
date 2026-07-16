import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { effect_welloe_force } from "../../src/abilities/piecieEffects.js";

function makeSlot(cardId: string, mp: number, level = 1, isDefeated = false) {
  return {
    cardId,
    name: cardId,
    mp,
    level,
    isDefeated,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makePlayer(activeSlots: any[]) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    activeSlots,
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
  };
}

function makeState(activeSlots: any[]) {
  return {
    activePlayerId: "player_1",
    turnNumber: 7,
    status: "PLAYING",
    activePlace: null,
    sharedGeneralQuestDeck: [] as any[],
    sharedGeneralQuestDiscard: [] as any[],
    players: {
      player_1: makePlayer(activeSlots),
      player_2: makePlayer([makeSlot("mosje_binti", 80, 2), null]),
    },
  } as any;
}

describe("Welloe Force tribute payer", () => {
  it("deducts exactly 40 MP from the chosen payer slot and activates the redirect", () => {
    const state = makeState([makeSlot("mosje_coert", 80, 1), null]);
    state._pendingTargets = { welloeForcePayerSlot: 0 };

    const next = effect_welloe_force(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(40);
    expect(next._welloeForceActive).toEqual({
      ownerId: "player_1",
      turnsRemaining: 3,
      targetSlotId: null,
    });
  });

  it("is a no-op (no charge, no redirect) when _pendingTargets is undefined", () => {
    const state = makeState([makeSlot("mosje_coert", 80, 1), null]);

    const next = effect_welloe_force(state, "player_1");

    expect(next.players.player_1.activeSlots[0].mp).toBe(80);
    expect(next._welloeForceActive).toBeUndefined();
  });

  it("is a no-op when welloeForcePayerSlot points at a null or defeated slot", () => {
    const nullSlotState = makeState([makeSlot("mosje_coert", 80, 1), null]);
    nullSlotState._pendingTargets = { welloeForcePayerSlot: 1 };

    const nullSlotNext = effect_welloe_force(nullSlotState, "player_1");
    expect(nullSlotNext.players.player_1.activeSlots[0].mp).toBe(80);
    expect(nullSlotNext._welloeForceActive).toBeUndefined();

    const defeatedSlotState = makeState([
      makeSlot("mosje_coert", 80, 1),
      makeSlot("mosje_jeffrey", 90, 1, true),
    ]);
    defeatedSlotState._pendingTargets = { welloeForcePayerSlot: 1 };

    const defeatedSlotNext = effect_welloe_force(defeatedSlotState, "player_1");
    expect(defeatedSlotNext.players.player_1.activeSlots[1].mp).toBe(90);
    expect(defeatedSlotNext._welloeForceActive).toBeUndefined();
  });
});
