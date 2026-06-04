// BAL-05: Deck-out engine behavior
// @ts-expect-error — JS module, no type declarations
import { phaseDrawCard, startTurn } from "../../src/engine/turnManager.js";
import { describe, expect, it } from "vitest";

function makeState(
  p1Deck: string[],
  p1Discard: string[],
  p1SkipNextTurn = false
) {
  return {
    activePlayerId: "p1",
    turnNumber: 1,
    status: "IN_PROGRESS",
    winnerId: null,
    winReason: null,
    activePlace: null,
    activeQuest: null,
    sharedPlaceSlot: null,
    _snelleFlags: {},
    _pendingTargets: {},
    sharedGeneralQuestDiscard: [],
    momentumCheckPhase: false,
    players: {
      p1: {
        deck: [...p1Deck],
        graveyard: [...p1Discard],
        hand: [],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        pieciesPlayedThisTurn: 0,
        pieciesActivatedThisTurn: 0,
        lastCardPlayedType: null,
        instantPiecieThisTurn: false,
        chainReactionActive: false,
        abilityDoubleTrigger: false,
        drawsThisTurn: 0,
        actionsThisTurn: [],
        freePiecieActivationAvailable: false,
        mpAmplifierActive: false,
        questPrepBonus: 0,
        skipNextTurn: p1SkipNextTurn,
        totalDamageTaken: 0,
        activeSlots: [null, null, null, null],
        piecieSlots: [null, null, null, null],
      },
      p2: {
        deck: ["card_a", "card_b"],
        graveyard: [],
        hand: [],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        pieciesPlayedThisTurn: 0,
        pieciesActivatedThisTurn: 0,
        lastCardPlayedType: null,
        instantPiecieThisTurn: false,
        chainReactionActive: false,
        abilityDoubleTrigger: false,
        drawsThisTurn: 0,
        actionsThisTurn: [],
        freePiecieActivationAvailable: false,
        mpAmplifierActive: false,
        questPrepBonus: 0,
        skipNextTurn: false,
        totalDamageTaken: 0,
        activeSlots: [null, null, null, null],
        piecieSlots: [null, null, null, null],
      },
    },
  };
}

describe("deck-out behavior (BAL-05)", () => {
  it("phaseDrawCard reshuffles discard into deck when deck is empty", () => {
    const state = makeState([], ["c1", "c2", "c3"]);
    const result = phaseDrawCard(state, "p1");
    expect(result.players.p1.graveyard.length).toBe(0);
    expect(result.players.p1.hand.length).toBe(1);
  });

  it("phaseDrawCard sets player.skipNextTurn = true after reshuffle", () => {
    const state = makeState([], ["c1", "c2", "c3"]);
    const result = phaseDrawCard(state, "p1");
    expect(result.players.p1.skipNextTurn).toBe(true);
  });

  it("phaseDrawCard draws 1 card from the reshuffled deck", () => {
    const state = makeState([], ["c1", "c2", "c3"]);
    const result = phaseDrawCard(state, "p1");
    const drawnCard = result.players.p1.hand[0];
    expect(["c1", "c2", "c3"]).toContain(drawnCard);
  });

  it("phaseDrawCard does nothing when both deck and discard are empty", () => {
    const state = makeState([], []);
    const result = phaseDrawCard(state, "p1");
    expect(result.players.p1.hand.length).toBe(0);
    expect(result.players.p1.skipNextTurn).not.toBe(true);
  });

  it("startTurn skips the entire turn when skipNextTurn is true", () => {
    const state = makeState(["c1"], [], true);
    const result = startTurn(state);
    expect(result.activePlayerId).toBe("p2");
  });

  it("startTurn clears skipNextTurn flag after skipping", () => {
    const state = makeState(["c1"], [], true);
    const result = startTurn(state);
    expect(result.players.p1.skipNextTurn).toBe(false);
  });

  it("startTurn advances activePlayerId to next player on skip", () => {
    const state = makeState(["c1"], [], true);
    const result = startTurn(state);
    expect(result.activePlayerId).not.toBe("p1");
    expect(result.activePlayerId).toBe("p2");
  });
});
