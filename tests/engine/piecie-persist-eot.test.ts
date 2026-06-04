import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { activatePiecie, endTurn } from "../../src/engine/turnManager.js";

function makeState(overrides: { mp?: number; turnNumber?: number } = {}) {
  const { mp = 50, turnNumber = 2 } = overrides;
  return {
    activePlayerId: "player_1",
    turnNumber,
    activePlace: null,
    activeQuest: null,
    sharedPlaceSlot: null,
    status: "IN_PROGRESS",
    winnerId: null,
    winReason: null,
    _snelleFlags: {},
    _pendingTargets: {},
    sharedGeneralQuestDiscard: [],
    players: {
      player_1: {
        hand: [],
        deck: [],
        graveyard: [],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesActivatedThisTurn: 0,
        pieciesPlayedThisTurn: 0,
        actionsThisTurn: [],
        questPrepBonus: 2,
        totalDamageTaken: 0,
        activeSlots: [
          {
            cardId: "mosje_test",
            name: "Test Mosje",
            mp,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [
          {
            cardId: "piecie_quest_prep",
            type: "PIECIE",
            faceDown: true,
            activated: false,
            playedOnTurn: 1,
            canActivateOnTurn: 2,
          },
          null,
          null,
          null,
        ],
      },
      player_2: {
        hand: [],
        deck: [],
        graveyard: [],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesActivatedThisTurn: 0,
        pieciesPlayedThisTurn: 0,
        actionsThisTurn: [],
        questPrepBonus: 0,
        totalDamageTaken: 0,
        activeSlots: [
          {
            cardId: "mosje_opponent",
            name: "Opponent Mosje",
            mp: 50,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [null, null, null, null],
      },
    },
  };
}

describe("Dubbele Dosis — Persist Until End-of-Turn (BUG-02)", () => {
  it("slot is NOT null immediately after activatePiecie", () => {
    const state = makeState();
    const { state: newState, success } = activatePiecie(state, "player_1", 0);
    expect(success).toBe(true);
    expect(newState.players.player_1.piecieSlots[0]).not.toBeNull();
  });

  it("slot has persistUntilEoT flag after activation", () => {
    const state = makeState();
    const { state: newState } = activatePiecie(state, "player_1", 0);
    expect(newState.players.player_1.piecieSlots[0]?.persistUntilEoT).toBe(true);
  });

  it("questPrepBonus is set after activation", () => {
    const state = makeState();
    const { state: newState } = activatePiecie(state, "player_1", 0);
    expect(newState.players.player_1.questPrepBonus).toBeGreaterThanOrEqual(2);
  });

  it("slot IS null after endTurn", () => {
    const state = makeState();
    const { state: afterActivate } = activatePiecie(state, "player_1", 0);
    const afterEnd = endTurn(afterActivate);
    expect(afterEnd.players.player_1.piecieSlots[0]).toBeNull();
  });

  it("piecie_quest_prep is in graveyard after endTurn", () => {
    const state = makeState();
    const { state: afterActivate } = activatePiecie(state, "player_1", 0);
    const afterEnd = endTurn(afterActivate);
    // After endTurn, player_1's discard should contain the card
    const p1Graveyard = afterEnd.players.player_1.graveyard;
    expect(p1Graveyard).toContain("piecie_quest_prep");
  });

  it("questPrepBonus is 0 after endTurn when no quest was attempted", () => {
    const state = makeState();
    // questPrepBonus starts at 2 in makeState (simulating a bonus that was set but never consumed)
    const afterEnd = endTurn(state);
    expect(afterEnd.players.player_1.questPrepBonus).toBe(0);
  });
});
