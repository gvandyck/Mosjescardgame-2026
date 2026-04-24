import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest } from "../../src/abilities/questLogic.js";

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
            cardId: "mosje_west",
            name: "West",
            mp,
            level: 0,
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
            level: 0,
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

describe("Geen Raad Vraag Aad — resolveQuest", () => {
  it("correct guess: active player gains 50 MP", () => {
    const state = makeState(30);
    const result = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, true, 0);
    expect(result.players.player_1.activeSlots[0].mp).toBe(80);
  });

  it("wrong guess: active player loses 25 MP", () => {
    const state = makeState(30);
    const result = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, false, 0);
    expect(result.players.player_1.activeSlots[0].mp).toBe(5);
  });

  it("correct guess increments questsCompleted", () => {
    const state = makeState(30);
    const result = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, true, 0);
    expect(result.players.player_1.questsCompleted).toBe(1);
  });

  it("wrong guess does not increment questsCompleted", () => {
    const state = makeState(30);
    const result = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, false, 0);
    expect(result.players.player_1.questsCompleted).toBe(0);
  });

  it("opponent MP is unaffected during resolution", () => {
    const state = makeState(30);
    const result = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, true, 0);
    expect(result.players.player_2.activeSlots[0].mp).toBe(40);
  });
});

describe("Geen Raad Vraag Aad — no dice roll involved", () => {
  it("resolveQuest can be called with any boolean for didSucceed (no internal roll)", () => {
    const state = makeState(30);
    const successResult = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, true, 0);
    const failResult = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, false, 0);
    expect(successResult.players.player_1.activeSlots[0].mp).toBe(80);
    expect(failResult.players.player_1.activeSlots[0].mp).toBe(5);
  });
});
