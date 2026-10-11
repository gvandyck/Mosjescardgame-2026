// BAL-05: Deck-out engine behavior
// @ts-expect-error — JS module, no type declarations
import { phaseDrawCard, startTurn, endTurn } from "../../src/engine/turnManager.js";
import { describe, expect, it } from "vitest";

function makeState(
  p1Deck: string[],
  p1Discard: string[],
  p1CooldownTurn = false
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
        cooldownTurn: p1CooldownTurn,
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
        cooldownTurn: false,
        totalDamageTaken: 0,
        activeSlots: [null, null, null, null],
        piecieSlots: [null, null, null, null],
      },
    },
  };
}

// Give both players one live Mosje so checkVictory doesn't end the game on an
// empty board (KNOCKOUT fires when a player has no active Mosjes).
function giveLiveMosjes(state: any) {
  const slot = (cardId: string) => ({
    cardId, name: cardId, subtype: "FIGHTING", traits: {}, mp: 50, level: 1,
    isDefeated: false, statusEffects: [], abilityUsedThisTurn: false,
  });
  state.players.p1.activeSlots = [slot("mosje_p1"), null, null, null];
  state.players.p2.activeSlots = [slot("mosje_p2"), null, null, null];
}

describe("deck-out behavior (BAL-05)", () => {
  it("phaseDrawCard reshuffles discard into deck when deck is empty", () => {
    const state = makeState([], ["c1", "c2", "c3"]);
    const result = phaseDrawCard(state, "p1");
    expect(result.players.p1.graveyard.length).toBe(0);
    expect(result.players.p1.hand.length).toBe(1);
  });

  it("phaseDrawCard sets player.cooldownTurn = true after reshuffle (2.0 RULE-07)", () => {
    const state = makeState([], ["c1", "c2", "c3"]);
    const result = phaseDrawCard(state, "p1");
    expect(result.players.p1.cooldownTurn).toBe(true);
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
    expect(result.players.p1.cooldownTurn).not.toBe(true);
  });

  // 2.0 replaces the V4 skip: a deck-out turn is NOT skipped, it is a cooldown turn.
  it("startTurn does NOT skip a cooldown player's turn (V4 skip removed)", () => {
    const state = makeState(["c1"], [], true);
    giveLiveMosjes(state);
    const result = startTurn(state);
    expect(result.activePlayerId).toBe("p1");
    expect(result.players.p1.hand.length).toBe(1);
  });

  it("startTurn keeps cooldownTurn set for the whole turn; endTurn clears it", () => {
    const state = makeState(["c1"], [], true);
    giveLiveMosjes(state);
    const started = startTurn(state);
    expect(started.players.p1.cooldownTurn).toBe(true);
    const ended = endTurn(started);
    expect(ended.players.p1.cooldownTurn).toBe(false);
    expect(ended.activePlayerId).toBe("p2");
  });

  it("both players on cooldown still alternate normally", () => {
    const state = makeState(["c1"], [], true);
    giveLiveMosjes(state);
    state.players.p2.cooldownTurn = true;
    let s = endTurn(startTurn(state));
    expect(s.activePlayerId).toBe("p2");
    s = startTurn(s);
    expect(s.players.p2.cooldownTurn).toBe(true);
    s = endTurn(s);
    expect(s.activePlayerId).toBe("p1");
    expect(s.players.p1.cooldownTurn).toBe(false);
  });
});
