import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { checkQuestCondition } from "../../src/engine/quests/checkQuestCondition.js";
// @ts-expect-error — JS module, no type declarations
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
// @ts-expect-error — JS module, no type declarations
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";

// Momentum Master, rewritten for Obby 2.0: gate = costId mp_80_plus ("Mosje has 80 MP or more").
// V4 canAttemptGeneralQuest / getQuestDiceThreshold are gone; dice = stars of the rolled trait.
const MM = getQuestDef("quest_momentum_master");
const OTHER = getQuestDef("quest_arm_wrestling");

function makeState(mp: number) {
  return {
    players: {
      player_1: {
        activeSlots: [
          { cardId: "mosje_martin_senor_west", name: "West", mp, level: 1, isDefeated: false,
            traits: { mental: 3, technical: 1, physical: 2 }, statusEffects: [], abilityUsedThisTurn: false },
          null,
        ],
        hand: [], deck: [], discard: [],
      },
    },
  } as any;
}
const check = (q: any, mp: number) => checkQuestCondition(makeState(mp), "player_1", 0, q).ok;

describe("Momentum Master — checkQuestCondition (mp_80_plus)", () => {
  it("blocks attempt when Mosje MP is below 80", () => expect(check(MM, 79)).toBe(false));
  it("allows attempt when Mosje MP is exactly 80", () => expect(check(MM, 80)).toBe(true));
  it("allows attempt when Mosje MP is between 80-100", () => expect(check(MM, 90)).toBe(true));
  it("allows attempt when Mosje MP is exactly 100", () => expect(check(MM, 100)).toBe(true));
  // Changed expectation: V4 blocked above 100 MP. The Card List text is "80 MP or more", so there is no upper bound.
  it("allows attempt above 100 MP (2.0: 80 or more, no upper bound)", () => expect(check(MM, 101)).toBe(true));
  it("does not apply the MP check to other quests", () => expect(check(OTHER, 30)).toBe(true));
});

describe("Momentum Master — dice (replaces V4 getQuestDiceThreshold)", () => {
  it("rolls one die per star of the quest's trait (2 physical stars -> 2 dice)", () => {
    expect(MM.rollTrait).toBe("physical");
    expect(getQuestDiceCount(makeState(90), "player_1", makeState(90).players.player_1.activeSlots[0], MM)).toBe(2);
  });
});
