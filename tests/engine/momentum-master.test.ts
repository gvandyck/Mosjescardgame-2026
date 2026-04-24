import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { canAttemptGeneralQuest, getQuestDiceThreshold } from "../../src/abilities/questLogic.js";

const MOMENTUM_MASTER_QUEST = {
  id: "quest_momentum_master",
  requirementId: "quest_req_momentum_master",
  successMP: 55,
  failMP: -20,
};

const OTHER_QUEST = {
  id: "quest_arm_wrestling",
  requirementId: "quest_req_arm_wrestling",
  successMP: 30,
  failMP: 0,
};

function makeState(pieciesPlayed: number, mp = 30) {
  return {
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_west",
            name: "West",
            mp,
            level: 0,
            isDefeated: false,
            traits: { mental: 3, technical: 1 },
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        pieciesPlayedThisTurn: pieciesPlayed,
        hand: [],
        deck: [],
        discard: [],
      },
    },
  };
}

describe("Momentum Master — canAttemptGeneralQuest", () => {
  it("blocks attempt when 0 Piecies used this turn", () => {
    const state = makeState(0);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(false);
  });

  it("blocks attempt when 1 Piecie used this turn", () => {
    const state = makeState(1);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(false);
  });

  it("allows attempt when exactly 2 Piecies used this turn", () => {
    const state = makeState(2);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(true);
  });

  it("allows attempt when 3+ Piecies used this turn", () => {
    const state = makeState(4);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(true);
  });

  it("still blocks when Mosje has negative MP even with 2+ Piecies", () => {
    const state = makeState(2, -5);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(false);
  });

  it("does not apply Piecie check to other quests", () => {
    const state = makeState(0);
    expect(canAttemptGeneralQuest(OTHER_QUEST, state, "player_1")).toBe(true);
  });
});

describe("Momentum Master — getQuestDiceThreshold", () => {
  const dummyMosje = {
    cardId: "mosje_west",
    traits: { mental: 3 },
  };

  it("returns 3 for Momentum Master", () => {
    expect(getQuestDiceThreshold(MOMENTUM_MASTER_QUEST, dummyMosje)).toBe(3);
  });

  it("returns 4 (default) for quests without a specific threshold mapping", () => {
    const unknownQuest = { id: "quest_unknown", requirementId: "quest_req_unknown" };
    expect(getQuestDiceThreshold(unknownQuest, dummyMosje)).toBe(4);
  });
});
