import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { canAttemptGeneralQuest, getQuestDiceThreshold } from "../../src/abilities/questLogic.js";

const MOMENTUM_MASTER_QUEST = {
  id: "quest_momentum_master",
  requirementId: "quest_req_momentum_master",
  roll: { trait: null, thresholds: { 1: 1, 2: 1, 3: 1 } },
  successMP: 60,
  failMP: -40,
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
  it("blocks attempt when Mosje MP is below 80", () => {
    const state = makeState(0, 79);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(false);
  });

  it("blocks attempt when Mosje MP is above 100", () => {
    const state = makeState(0, 101);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(false);
  });

  it("allows attempt when Mosje MP is exactly 80", () => {
    const state = makeState(0, 80);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(true);
  });

  it("allows attempt when Mosje MP is between 80-100", () => {
    const state = makeState(0, 90);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(true);
  });

  it("allows attempt when Mosje MP is exactly 100", () => {
    const state = makeState(0, 100);
    expect(canAttemptGeneralQuest(MOMENTUM_MASTER_QUEST, state, "player_1")).toBe(true);
  });

  it("does not apply MP check to other quests", () => {
    const state = makeState(0, 30);
    expect(canAttemptGeneralQuest(OTHER_QUEST, state, "player_1")).toBe(true);
  });
});

describe("Momentum Master — getQuestDiceThreshold", () => {
  const dummyMosje = {
    cardId: "mosje_west",
    traits: { mental: 3 },
  };

  it("returns 1 for Momentum Master (auto-succeed when MP 80-100)", () => {
    expect(getQuestDiceThreshold(MOMENTUM_MASTER_QUEST, dummyMosje)).toBe(1);
  });

  it("returns 4 (default) for quests with roll but no thresholds", () => {
    const unknownQuest = { id: "quest_unknown", requirementId: "quest_req_unknown", roll: {} };
    expect(getQuestDiceThreshold(unknownQuest, dummyMosje)).toBe(4);
  });
});
