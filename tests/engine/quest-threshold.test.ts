import { describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { getQuestDiceThreshold, quest_req_strategy_puzzle, quest_req_quick_thinking } from "../../src/abilities/questLogic.js";

// Mock rollDie to return a fixed value (6) so threshold tests are deterministic.
// We care about the threshold value, not whether the roll succeeds.
vi.mock("../../src/engine/deckEngine.js", () => ({
  rollDie: () => 6,
  drawCards: (deck: any[], n: number) => deck.splice(0, n),
  shuffleDeck: (deck: any[]) => deck,
}));

const strategyPuzzleQuest = {
  id: "quest_strategy_puzzle",
  type: "QUEST",
  questType: "GENERAL",
  requirementId: "quest_req_strategy_puzzle",
  roll: { trait: "mental", thresholds: { 1: 5, 2: 3, 3: 2 } },
  requirementDescription: "Roll: Mental ★=5+, ★★=3+, ★★★=2+",
  successMP: 45,
  failMP: -25,
};

const quickThinkingQuest = {
  id: "quest_quick_thinking",
  type: "QUEST",
  questType: "GENERAL",
  requirementId: "quest_req_quick_thinking",
  roll: { trait: "mental", thresholds: { 1: 5, 2: 4, 3: 3 } },
  requirementDescription: "Roll: Mental ★=5+, ★★=4+, ★★★=3+",
  successMP: 20,
  failMP: -20,
};

function makeMosje(mental: number) {
  return {
    cardId: "mosje_test",
    name: "Test Mosje",
    mp: 50,
    level: 0,
    isDefeated: false,
    traits: mental > 0 ? { mental } : {},
    statusEffects: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path A — getQuestDiceThreshold (display threshold shown in modal)
// ─────────────────────────────────────────────────────────────────────────────

describe("getQuestDiceThreshold — Strategy Puzzle (BUG-01)", () => {
  it("mental=3 → threshold 2 (★★★=2+)", () => {
    expect(getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(3))).toBe(2);
  });
  it("mental=2 → threshold 3 (★★=3+)", () => {
    expect(getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(2))).toBe(3);
  });
  it("mental=1 → threshold 5 (★=5+)", () => {
    expect(getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(1))).toBe(5);
  });
  it("no mental trait → threshold 5 (fallback to level 1)", () => {
    expect(getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(0))).toBe(5);
  });
});

describe("getQuestDiceThreshold — Quick Thinking", () => {
  it("mental=3 → threshold 3 (★★★=3+)", () => {
    expect(getQuestDiceThreshold(quickThinkingQuest, makeMosje(3))).toBe(3);
  });
  it("mental=2 → threshold 4 (★★=4+)", () => {
    expect(getQuestDiceThreshold(quickThinkingQuest, makeMosje(2))).toBe(4);
  });
  it("mental=1 → threshold 5 (★=5+)", () => {
    expect(getQuestDiceThreshold(quickThinkingQuest, makeMosje(1))).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// perMosjeConfig quests — Kickboxing Bootcamp (display/roll label bug)
// The roll path (runQuestDiceRoll in main.js) reads perMosjeConfig.threshold
// first; getQuestDiceThreshold must return the same value or the modal label
// disagrees with the actual roll (it showed the placeholder 6+ instead of
// Michelle's 4+ / Gandoe's 2+).
// ─────────────────────────────────────────────────────────────────────────────

const kickboxingQuest = {
  id: "quest_personal_kickboxing_bootcamp",
  type: "QUEST",
  questType: "PERSONAL",
  requirementId: "quest_req_kickboxing_bootcamp",
  roll: { trait: null, thresholds: { 1: 6, 2: 6, 3: 6 } },
  perMosjeConfig: {
    mosje_gandoe_destroyer: { threshold: 2, successMP: 60 },
    mosje_michelle: { threshold: 4, successMP: 80 },
  },
  successMP: 60,
  failMP: -20,
};

function makeNamedMosje(cardId: string) {
  return {
    cardId,
    name: cardId,
    mp: 50,
    level: 1,
    isDefeated: false,
    traits: {},
    statusEffects: [],
  };
}

describe("getQuestDiceThreshold — perMosjeConfig (Kickboxing Bootcamp)", () => {
  it("Michelle → threshold 4 (perMosjeConfig, not the placeholder 6)", () => {
    expect(getQuestDiceThreshold(kickboxingQuest, makeNamedMosje("mosje_michelle"))).toBe(4);
  });
  it("Gandoe → threshold 2 (perMosjeConfig, not the placeholder 6)", () => {
    expect(getQuestDiceThreshold(kickboxingQuest, makeNamedMosje("mosje_gandoe_destroyer"))).toBe(2);
  });
  it("Mosje without a perMosjeConfig entry → falls back to roll.thresholds (6)", () => {
    expect(getQuestDiceThreshold(kickboxingQuest, makeNamedMosje("mosje_youri"))).toBe(6);
  });
  it("matches the roll-path computation for every configured Mosje", () => {
    // Mirrors runQuestDiceRoll in main.js:
    //   perMosjeCfg ? perMosjeCfg.threshold : getQuestDiceThreshold(...)
    for (const cardId of Object.keys(kickboxingQuest.perMosjeConfig)) {
      const mosje = makeNamedMosje(cardId);
      const perCfg = kickboxingQuest.perMosjeConfig[cardId as keyof typeof kickboxingQuest.perMosjeConfig];
      const rollThreshold = perCfg ? perCfg.threshold : getQuestDiceThreshold(kickboxingQuest, mosje);
      expect(getQuestDiceThreshold(kickboxingQuest, mosje)).toBe(rollThreshold);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Path B — quest_req_strategy_puzzle (actual roll threshold)
// ─────────────────────────────────────────────────────────────────────────────

describe("quest_req_strategy_puzzle — threshold correctness (BUG-01)", () => {
  it("mental=3 → threshold 2", () => {
    const { threshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(3));
    expect(threshold).toBe(2);
  });
  it("mental=2 → threshold 3", () => {
    const { threshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(2));
    expect(threshold).toBe(3);
  });
  it("mental=1 → threshold 5", () => {
    const { threshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(1));
    expect(threshold).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Path A vs Path B agreement — Strategy Puzzle
// ─────────────────────────────────────────────────────────────────────────────

describe("quest_req_strategy_puzzle — threshold agreement with getQuestDiceThreshold (BUG-01)", () => {
  it("mental=3: display threshold === roll threshold (both = 2)", () => {
    const displayThreshold = getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(3));
    const { threshold: rollThreshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(3));
    expect(displayThreshold).toBe(2);
    expect(rollThreshold).toBe(2);
    expect(displayThreshold).toBe(rollThreshold);
  });
  it("mental=2: display threshold === roll threshold (both = 3)", () => {
    const displayThreshold = getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(2));
    const { threshold: rollThreshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(2));
    expect(displayThreshold).toBe(rollThreshold);
  });
  it("mental=1: display threshold === roll threshold (both = 5)", () => {
    const displayThreshold = getQuestDiceThreshold(strategyPuzzleQuest, makeMosje(1));
    const { threshold: rollThreshold } = quest_req_strategy_puzzle(strategyPuzzleQuest, makeMosje(1));
    expect(displayThreshold).toBe(rollThreshold);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Path A vs Path B agreement — Quick Thinking
// ─────────────────────────────────────────────────────────────────────────────

describe("quest_req_quick_thinking — threshold agreement", () => {
  it("mental=3: display threshold === roll threshold (both = 3)", () => {
    const displayThreshold = getQuestDiceThreshold(quickThinkingQuest, makeMosje(3));
    const { threshold: rollThreshold } = quest_req_quick_thinking(quickThinkingQuest, makeMosje(3));
    expect(displayThreshold).toBe(rollThreshold);
  });
  it("mental=2: display threshold === roll threshold (both = 4)", () => {
    const displayThreshold = getQuestDiceThreshold(quickThinkingQuest, makeMosje(2));
    const { threshold: rollThreshold } = quest_req_quick_thinking(quickThinkingQuest, makeMosje(2));
    expect(displayThreshold).toBe(rollThreshold);
  });
  it("mental=1: display threshold === roll threshold (both = 5)", () => {
    const displayThreshold = getQuestDiceThreshold(quickThinkingQuest, makeMosje(1));
    const { threshold: rollThreshold } = quest_req_quick_thinking(quickThinkingQuest, makeMosje(1));
    expect(displayThreshold).toBe(rollThreshold);
  });
});
