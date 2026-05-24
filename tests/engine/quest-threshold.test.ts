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
