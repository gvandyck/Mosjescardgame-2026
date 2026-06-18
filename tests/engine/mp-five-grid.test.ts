import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { roundToFive } from "../../src/engine/roundToFive.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// Game rule (2026-06-17): MP always lands on a multiple of 5. Effects that halve or
// scale MP (loss-halving, Dierenasiel −25%, 1.5× amplifier, Michelle half-reward) and
// the WELLOE_SHIELD survival value all snap to the nearest 5 via roundToFive.

describe("roundToFive — nearest multiple of 5", () => {
  it("rounds up or down to the nearest 5", () => {
    expect(roundToFive(7)).toBe(5);
    expect(roundToFive(7.5)).toBe(10);
    expect(roundToFive(8)).toBe(10);
    expect(roundToFive(12.5)).toBe(15);
    expect(roundToFive(13)).toBe(15);
    expect(roundToFive(22.5)).toBe(25);
    expect(roundToFive(0)).toBe(0);
  });

  it("every result is divisible by 5", () => {
    for (let n = 0; n <= 200; n += 0.5) {
      expect(roundToFive(n) % 5).toBe(0);
    }
  });
});

describe("MP-loss halving stays on the 5-grid", () => {
  it("a 15 MP loss halved → 10 (nearest 5), not 8 (old Math.ceil)", () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: "mosje_alyssa_fissa", name: "T", mp: 100, level: 1, isDefeated: false,
              statusEffects: [{ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 1 }], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const next = loseMP(state, "player_1", 0, 15, "TEST");
    expect(next.players.player_1.activeSlots[0].mp).toBe(90); // 100 − roundToFive(7.5)=10
    expect(next.players.player_1.activeSlots[0].mp % 5).toBe(0);
  });
});
