import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { playSnellie } from "../../src/engine/turnManager.js";

function makeState(filledPiecieSlots: number = 0) {
  const piecieSlots = [];
  for (let i = 0; i < filledPiecieSlots; i++) {
    piecieSlots.push({
      cardId: "piecie_test",
      faceDown: false,
      canActivate: false,
    });
  }
  while (piecieSlots.length < 4) {
    piecieSlots.push(null);
  }

  return {
    activePlayerId: "player_1",
    turnNumber: 1,
    players: {
      player_1: {
        hand: [
          { cardId: "snelle_test", type: "SNELLE_PIECIE" },
        ],
        deck: [],
        discard: [],
        activeSlots: [
          {
            cardId: "mosje_test",
            mp: 50,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots,
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
    },
  };
}

describe("Snelle Piecie — Full Slots Rule", () => {
  it("allows playing Snelle Piecie when no Piecies are on field", () => {
    const state = makeState(0);
    const cardRef = { cardId: "snelle_test", type: "SNELLE_PIECIE" };
    const cardDef = { name: "Test Snelle", effectId: "effect_test" };

    const { success, error } = playSnellie(state, "player_1", cardRef, cardDef);
    // Should succeed (or at least not fail due to full slots)
    if (error) {
      expect(error).not.toContain("all Piecie slots are full");
    }
  });

  it("allows playing Snelle Piecie when 1-3 Piecies are on field", () => {
    for (let i = 1; i <= 3; i++) {
      const state = makeState(i);
      const cardRef = { cardId: "snelle_test", type: "SNELLE_PIECIE" };
      const cardDef = { name: "Test Snelle", effectId: "effect_test" };

      const { error } = playSnellie(state, "player_1", cardRef, cardDef);
      // Should not fail due to full slots rule
      if (error) {
        expect(error).not.toContain("all Piecie slots are full");
      }
    }
  });

  it("blocks playing Snelle Piecie when all 4 slots are full", () => {
    const state = makeState(4);
    const cardRef = { cardId: "snelle_test", type: "SNELLE_PIECIE" };
    const cardDef = { name: "Test Snelle", effectId: "effect_test" };

    const { success, error } = playSnellie(state, "player_1", cardRef, cardDef);
    expect(success).toBe(false);
    expect(error).toBe("Cannot play Snelle Piecie — all Piecie slots are full.");
  });

  it("blocks at exactly 4 slots, not before", () => {
    const state3 = makeState(3);
    const state4 = makeState(4);
    const cardRef = { cardId: "snelle_test", type: "SNELLE_PIECIE" };
    const cardDef = { name: "Test Snelle", effectId: "effect_test" };

    const result3 = playSnellie(state3, "player_1", cardRef, cardDef);
    const result4 = playSnellie(state4, "player_1", cardRef, cardDef);

    // With 3 slots, should not be blocked by full slots rule
    expect(result3.success === true || (result3.error && !result3.error.includes("all Piecie slots are full"))).toBe(true);
    // With 4 slots, should be blocked by full slots rule
    expect(result4.success).toBe(false);
    expect(result4.error).toBe("Cannot play Snelle Piecie — all Piecie slots are full.");
  });
});
