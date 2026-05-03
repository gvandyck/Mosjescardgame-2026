import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";

function makeState(mp: number, level: number) {
  return {
    activePlace: null,
    players: {
      p1: {
        totalDamageTaken: 0,
        activeSlots: [
          {
            cardId: "mosje_martin_senor_west",
            name: "West",
            mp,
            level,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
      },
    },
  };
}

describe("loseMP — level regression", () => {
  it("normal damage within current MP: no level change", () => {
    const state = makeState(50, 1);
    const result = loseMP(state, "p1", 0, 20);
    expect(result.players.p1.activeSlots[0].mp).toBe(30);
    expect(result.players.p1.activeSlots[0].level).toBe(1);
  });

  it("damage exactly equal to current MP: goes to 0, no regression", () => {
    const state = makeState(30, 1);
    const result = loseMP(state, "p1", 0, 30);
    expect(result.players.p1.activeSlots[0].mp).toBe(0);
    expect(result.players.p1.activeSlots[0].level).toBe(1);
  });

  it("overflow at level 1: regresses to level 0, MP = 100 - overflow", () => {
    const state = makeState(10, 1);
    const result = loseMP(state, "p1", 0, 20);
    // overflow = 10, level 1 → 0, mp = 100 - 10 = 90
    expect(result.players.p1.activeSlots[0].mp).toBe(90);
    expect(result.players.p1.activeSlots[0].level).toBe(0);
  });

  it("overflow at level 2: regresses to level 1, MP = 100 - overflow", () => {
    const state = makeState(10, 2);
    const result = loseMP(state, "p1", 0, 20);
    expect(result.players.p1.activeSlots[0].mp).toBe(90);
    expect(result.players.p1.activeSlots[0].level).toBe(1);
  });

  it("massive overflow: regresses two levels", () => {
    // Level 2, 5 MP, takes 110 damage
    // Step 1: mp = 5 - 110 = -105, overflow = 105 → level 1, mp = 100 - 105 = -5
    // Step 2: mp = -5, overflow = 5 → level 0, mp = 100 - 5 = 95
    const state = makeState(5, 2);
    const result = loseMP(state, "p1", 0, 110);
    expect(result.players.p1.activeSlots[0].mp).toBe(95);
    expect(result.players.p1.activeSlots[0].level).toBe(0);
  });

  it("at level 0: excess damage is ignored, MP clamps to 0", () => {
    const state = makeState(10, 0);
    const result = loseMP(state, "p1", 0, 50);
    expect(result.players.p1.activeSlots[0].mp).toBe(0);
    expect(result.players.p1.activeSlots[0].level).toBe(0);
  });

  it("at level 0 with 0 MP: damage is ignored entirely", () => {
    const state = makeState(0, 0);
    const result = loseMP(state, "p1", 0, 25);
    expect(result.players.p1.activeSlots[0].mp).toBe(0);
    expect(result.players.p1.activeSlots[0].level).toBe(0);
  });

  it("mpLostThisTurn accumulates raw damage amount", () => {
    const state = makeState(50, 1);
    const result = loseMP(state, "p1", 0, 30);
    expect(result.players.p1.activeSlots[0].mpLostThisTurn).toBe(30);
  });

  it("mpLostThisTurn accumulates even when level regression fires", () => {
    const state = makeState(10, 1);
    const result = loseMP(state, "p1", 0, 20);
    expect(result.players.p1.activeSlots[0].mpLostThisTurn).toBe(20);
  });

  it("totalDamageTaken accumulates raw damage", () => {
    const state = makeState(50, 1);
    const result = loseMP(state, "p1", 0, 30);
    expect(result.players.p1.totalDamageTaken).toBe(30);
  });
});
