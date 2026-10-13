import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";

// 2.0 Physical Quest: Arm Wrestling (Skilled, 2 dice 4+), win +40 / lose -30 (Card List).
// V4 used Shotje Obby successMP 65; forceQuestResult drives the real attempt with forced dice.
const PHYSICAL_QUEST = "quest_arm_wrestling";

function makeSlot(cardId: string, mp = 40, level = 1) {
  return {
    cardId,
    name: cardId,
    subtype: "FIGHTING",
    traits: { physical: 2 }, // 2 stars = 2 dice for the Skilled Physical Quest
    mp,
    level,
    isDefeated: false,
    statusEffects: [] as unknown[],
    abilityUsedThisTurn: false,
  };
}

function makeState(activeSlots: (ReturnType<typeof makeSlot> | null)[]) {
  return {
    status: "ACTIVE",
    activePlayerId: "player_1",
    firstPlayerId: "player_2",
    turnNumber: 2,
    activePlace: null,
    players: {
      player_1: {
        name: "P1",
        hand: [],
        deck: [],
        graveyard: [],
        activeSlots,
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
      },
      player_2: {
        name: "P2",
        hand: [],
        deck: [],
        graveyard: [],
        activeSlots: [makeSlot("mosje_jeffrey"), null],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
      },
    },
  };
}

describe("Gandoe <-> Michelle synergy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // V4 Gandoe<->Michelle kicker and +15 partner bonus removed in 2.0 (Phase 58-01): no such synergy in the Card List.
  it("Michelle gets no Gandoe partner bonus on a Physical Quest", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55);
    // Michelle starts at 40 MP; Arm Wrestling +40 doubled by Tough Gamble = one gain of 80.
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 40, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical")).toBe(0);

    const result = forceQuestResult(state, "player_1", { slotIndex: 1, questId: PHYSICAL_QUEST, win: true });
    const michelle = result.players.player_1.activeSlots[1];

    expect(michelle.level).toBe(2);
    // 2.0: Tough Gamble (die 4 = double) is a questWinAmount modifier: ONE gain of 80 -> Level 2 at 0 MP.
    expect(michelle.mp).toBe(0);
  });
});
