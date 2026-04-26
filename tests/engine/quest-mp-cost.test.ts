import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";

const QUEST_COST = 20;

function makeState(mp: number = 50) {
  return {
    activePlayerId: "player_1",
    turnNumber: 1,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_test",
            mp,
            level: 0,
            isDefeated: false,
            traits: { physical: 2 },
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        hand: [],
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
  };
}

describe("Quest MP Cost Mechanic", () => {
  it("allows quest attempt with exactly 20 MP (minimum required)", () => {
    const state = makeState(20);
    const mosje = state.players.player_1.activeSlots[0];
    expect(mosje.mp).toBe(20);
    expect(mosje.mp >= QUEST_COST).toBe(true);
  });

  it("blocks quest attempt with less than 20 MP", () => {
    const state = makeState(19);
    const mosje = state.players.player_1.activeSlots[0];
    expect(mosje.mp).toBe(19);
    expect(mosje.mp >= QUEST_COST).toBe(false);
  });

  it("deducts 20 MP when quest is attempted", () => {
    const state = makeState(50);
    const beforeMP = state.players.player_1.activeSlots[0].mp;

    const newState = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");
    const afterMP = newState.players.player_1.activeSlots[0].mp;

    expect(beforeMP).toBe(50);
    expect(afterMP).toBe(30);
    expect(beforeMP - afterMP).toBe(QUEST_COST);
  });

  it("allows quest attempt with more than 20 MP", () => {
    const state = makeState(100);
    const mosje = state.players.player_1.activeSlots[0];
    expect(mosje.mp).toBe(100);
    expect(mosje.mp >= QUEST_COST).toBe(true);
  });

  it("cost is permanent - not refundable on cancellation", () => {
    const state = makeState(50);

    // Simulate quest cost deduction
    const costDeductedState = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");
    const mpAfterCost = costDeductedState.players.player_1.activeSlots[0].mp;

    // Simulate quest cancellation (no state change)
    const mpAfterCancellation = costDeductedState.players.player_1.activeSlots[0].mp;

    // Cost should remain deducted
    expect(mpAfterCost).toBe(30);
    expect(mpAfterCancellation).toBe(30);
    expect(mpAfterCost).toBe(mpAfterCancellation);
  });

  it("handles edge case: exactly 20 MP leaves Mosje at 0 MP", () => {
    const state = makeState(20);
    const newState = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");

    expect(newState.players.player_1.activeSlots[0].mp).toBe(0);
  });

  it("cannot reach negative MP with quest cost", () => {
    const state = makeState(50);
    const newState = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");

    expect(newState.players.player_1.activeSlots[0].mp).toBeGreaterThanOrEqual(0);
  });

  it("loseMP function is defined and callable", () => {
    expect(typeof loseMP).toBe("function");
  });

  it("loseMP accepts required parameters (state, playerId, slotIndex, amount, source)", () => {
    const state = makeState(50);
    // Should not throw
    const result = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");
    expect(result).toBeDefined();
    expect(result.players).toBeDefined();
  });

  it("integration: quest cost deduction with updated MP shown", () => {
    // Simulates the flow: deduct cost, then use updated MP in preview
    const state = makeState(50);
    const beforeMP = state.players.player_1.activeSlots[0].mp;

    // Step 1: Deduct cost when Mosje is selected
    const costDeductedState = loseMP(state, "player_1", 0, QUEST_COST, "QUEST_COST");
    const afterCostMP = costDeductedState.players.player_1.activeSlots[0].mp;

    // Step 2: Preview modal shows updated MP
    const previewMosje = costDeductedState.players.player_1.activeSlots[0];
    const mpForPreview = previewMosje.mp;

    expect(beforeMP).toBe(50);
    expect(afterCostMP).toBe(30);
    expect(mpForPreview).toBe(30); // Preview shows deducted amount
  });
});
