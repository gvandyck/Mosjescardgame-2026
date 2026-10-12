import { describe, expect, it } from "vitest";
import { forceQuestResult } from "../helpers/forceQuestResult.js";

const GEEN_RAAD_QUEST = {
  id: "quest_geen_raad_vraag_aad",
  requirementId: "quest_req_geen_raad_vraag_aad",
  successMP: 50,
  failMP: -25,
};

function makeState(mp = 30) {
  return {
    activePlace: null,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_martin_senor_west",
            name: "West",
            mp,
            level: 1,
            isDefeated: false,
            traits: { mental: 3 },
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        hand: [],
        deck: [],
        discard: [],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        activeSlots: [
          {
            cardId: "mosje_jisca",
            name: "Jisca",
            mp: 40,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        hand: [
          { cardId: "kannetje-melk", type: "PIECIE" },
          { cardId: "mosje_jisca", type: "MOSJE" },
        ],
        deck: [],
        discard: [],
        piecieSlots: [null, null, null, null],
      },
    },
  };
}

describe("Geen Raad Vraag Aad — 2.0 coin flip attempt", () => {
  it("correct guess: active player gains 50 MP", () => {
    const state = makeState(30);
    const result = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: true });
    expect(result.players.player_1.activeSlots[0].mp).toBe(80);
  });

  it("wrong guess: active player loses 25 MP", () => {
    const state = makeState(30);
    const result = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: false });
    expect(result.players.player_1.activeSlots[0].mp).toBe(5);
  });

  it("correct guess increments questsCompleted", () => {
    const state = makeState(30);
    const result = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: true });
    expect(result.players.player_1.questsCompleted).toBe(1);
  });

  it("wrong guess does not increment questsCompleted", () => {
    const state = makeState(30);
    const result = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: false });
    expect(result.players.player_1.questsCompleted).toBe(0);
  });

  it("opponent MP is unaffected during resolution", () => {
    const state = makeState(30);
    const result = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: true });
    expect(result.players.player_2.activeSlots[0].mp).toBe(40);
  });
});

describe("Geen Raad Vraag Aad — coin flip is one die, 4+", () => {
  it("win and fail both resolve from the same state (forced 6 vs forced 1 on the single die)", () => {
    const state = makeState(30);
    const successResult = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: true });
    const failResult = forceQuestResult(state, "player_1", { questId: GEEN_RAAD_QUEST.id, win: false });
    expect(successResult.players.player_1.activeSlots[0].mp).toBe(80);
    expect(failResult.players.player_1.activeSlots[0].mp).toBe(5);
  });
});
