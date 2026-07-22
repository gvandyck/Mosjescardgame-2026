import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { getPartnerSynergyQuestBonus, resolveQuest } from "../../src/abilities/questLogic.js";

const PHYSICAL_QUEST = {
  id: "quest_shotje_obby",
  type: "QUEST",
  questType: "GENERAL",
  category: "Physical",
  requirementId: "quest_req_shotje_obby",
  successMP: 65,
  failMP: -20,
};

function makeSlot(cardId: string, mp = 40, level = 1) {
  return {
    cardId,
    name: cardId,
    subtype: "FIGHTING",
    traits: {},
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

  it("Michelle -> Gandoe: roll 5 grants Gandoe the Destroyer +10 MP", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 40, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 1);

    expect(result.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it("Michelle -> Gandoe: roll 4 does not grant the separate Gandoe kicker", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55);
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 40, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 1);

    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
  });

  it("Michelle -> Gandoe: roll 5 does not grant the kicker to Gandoe Wizard", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    const state = makeState([
      makeSlot("mosje_gandoe_wizard", 40, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 1);

    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
  });

  it("Michelle -> Gandoe: roll 5 kicker is MP-only and does not level Gandoe", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 95, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 1);
    const gandoe = result.players.player_1.activeSlots[0];

    expect(gandoe.mp).toBe(100);
    expect(gandoe.level).toBe(1);
  });

  it("Gandoe -> Michelle: Physical Quest has +15 partner-synergy bonus when Michelle is on field", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55);
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 10, 1),
      makeSlot("mosje_michelle", 30, 1),
    ]);

    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical", "mosje_gandoe_destroyer")).toBe(15);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 0);

    expect(result.players.player_1.activeSlots[0].mp).toBe(90);
  });

  it("Gandoe -> Michelle: the +15 Physical Quest bonus is scoped to Gandoe, not Michelle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55);
    const state = makeState([
      makeSlot("mosje_gandoe_destroyer", 40, 1),
      makeSlot("mosje_michelle", 40, 1),
    ]);

    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical", "mosje_michelle")).toBe(0);

    const result = resolveQuest(state, "player_1", PHYSICAL_QUEST, true, 1);
    const michelle = result.players.player_1.activeSlots[1];

    expect(michelle.level).toBe(2);
    expect(michelle.mp).toBe(70);
  });
});
