import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { attemptGeneralQuest, attemptPersonalQuest } from "../../src/engine/turnManager.js";

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    activePlayerId: "player_1",
    activePlace: null,
    turnNumber: 1,
    sharedGeneralQuestDeck: [
      { cardId: "quest_momentum_master", type: "QUEST" },
      { cardId: "quest_jisca_flair", type: "QUEST" },
    ],
    sharedGeneralQuestDiscard: [],
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_martin_senor_west",
            name: "West",
            mp: 50,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        hand: [
          { cardId: "quest_personal_west", type: "QUEST" },
        ],
        deck: [],
        discard: [],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
    },
    ...overrides,
  };
}

describe("Quest Haven — attemptGeneralQuest gate", () => {
  it("first quest attempt is always allowed", () => {
    const state = makeState();
    const { questCard } = attemptGeneralQuest(state);
    expect(questCard).not.toBeNull();
    expect(questCard.cardId).toBe("quest_momentum_master");
  });

  it("second attempt is blocked without Quest Haven", () => {
    const state = makeState();
    state.players.player_1.questsAttemptedThisTurn = 1;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { questCard } = attemptGeneralQuest(state);
    expect(questCard).toBeNull();
  });

  it("second attempt is allowed with Quest Haven active", () => {
    const state = makeState({ activePlace: "place_quest_haven" });
    state.players.player_1.questsAttemptedThisTurn = 1;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { questCard } = attemptGeneralQuest(state);
    expect(questCard).not.toBeNull();
    expect(questCard.cardId).toBe("quest_momentum_master");
  });

  it("third attempt is blocked even with Quest Haven active", () => {
    const state = makeState({ activePlace: "place_quest_haven" });
    state.players.player_1.questsAttemptedThisTurn = 2;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { questCard } = attemptGeneralQuest(state);
    expect(questCard).toBeNull();
  });

  it("increments questsAttemptedThisTurn on successful draw", () => {
    const state = makeState();
    const { state: newState } = attemptGeneralQuest(state);
    expect(newState.players.player_1.questsAttemptedThisTurn).toBe(1);
  });

  it("also sets hasAttemptedQuestThisTurn for backwards compat", () => {
    const state = makeState();
    const { state: newState } = attemptGeneralQuest(state);
    expect(newState.players.player_1.hasAttemptedQuestThisTurn).toBe(true);
  });

  it("falls back to hasAttemptedQuestThisTurn boolean when counter missing", () => {
    const state = makeState();
    delete (state.players.player_1 as Record<string, unknown>).questsAttemptedThisTurn;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { questCard } = attemptGeneralQuest(state);
    expect(questCard).toBeNull();
  });
});

describe("Quest Haven — attemptPersonalQuest gate", () => {
  it("first personal quest attempt is allowed", () => {
    const state = makeState();
    const { eligible, questCard } = attemptPersonalQuest(state, "quest_personal_west");
    expect(eligible).toBe(true);
    expect(questCard).not.toBeNull();
  });

  it("second personal quest attempt is blocked without Quest Haven", () => {
    const state = makeState();
    state.players.player_1.questsAttemptedThisTurn = 1;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { eligible } = attemptPersonalQuest(state, "quest_personal_west");
    expect(eligible).toBe(false);
  });

  it("second personal quest attempt is allowed with Quest Haven active", () => {
    const state = makeState({ activePlace: "place_quest_haven" });
    state.players.player_1.questsAttemptedThisTurn = 1;
    state.players.player_1.hasAttemptedQuestThisTurn = true;
    const { eligible, questCard } = attemptPersonalQuest(state, "quest_personal_west");
    expect(eligible).toBe(true);
    expect(questCard?.cardId).toBe("quest_personal_west");
  });

  it("personal quest card is removed from hand after attempt", () => {
    const state = makeState();
    const { state: newState } = attemptPersonalQuest(state, "quest_personal_west");
    const inHand = newState.players.player_1.hand.some(
      (c: Record<string, unknown>) => c.cardId === "quest_personal_west"
    );
    expect(inHand).toBe(false);
  });

  it("increments questsAttemptedThisTurn on personal quest", () => {
    const state = makeState();
    const { state: newState } = attemptPersonalQuest(state, "quest_personal_west");
    expect(newState.players.player_1.questsAttemptedThisTurn).toBe(1);
  });

  it("returns eligible=false when card is not in hand", () => {
    const state = makeState();
    const { eligible } = attemptPersonalQuest(state, "quest_nonexistent");
    expect(eligible).toBe(false);
  });
});
