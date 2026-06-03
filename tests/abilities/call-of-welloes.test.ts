import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { endTurn, returnMosjeToWelloe } from "../../src/engine/turnManager.js";

// ─────────────────────────────────────────────────────────────
// Phase 22 — Wave 1: returnMosjeToWelloe + endTurn sweep
//   A. returnMosjeToWelloe pushes copy to welloe[] and nulls slot
//   B. returnMosjeToWelloe has NO defeat side-effects
//   C. returnMosjeToWelloe is a no-op on null slots
//   D. endTurn sweep returns summoned Mosje when anchor Piecie is gone
//   E. endTurn sweep leaves Mosje in place when anchor Piecie is still present
// ─────────────────────────────────────────────────────────────

function makePlayer(overrides: Record<string, any> = {}) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    welloe: [] as any[],
    activeSlots: [
      {
        cardId: "mosje_self",
        name: "Test Mosje",
        mp: 100,
        level: 1,
        isDefeated: false,
        traits: {},
        statusEffects: [],
        abilityUsedThisTurn: false,
      },
      null,
    ],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
    attackPieciePlayedThisTurn: false,
    ...overrides,
  };
}

function makeState(playerOverrides: Record<string, any> = {}) {
  return {
    activePlayerId: "player_1",
    activePlace: null,
    turnNumber: 3,
    players: {
      player_1: makePlayer(playerOverrides),
      player_2: makePlayer(),
    },
  } as any;
}

// Summoned mosje slot fixture
const summonedSlot = {
  cardId: "mosje_test",
  name: "T",
  mp: 70,
  level: 2,
  isDefeated: false,
  traits: {},
  statusEffects: [],
  abilityUsedThisTurn: false,
  summonedByPiecie: "piecie_call_of_welloes",
};

// ─────────────────────────────────────────────────────────────
// A. Return path — basic function behaviour
// ─────────────────────────────────────────────────────────────
describe("returnMosjeToWelloe — return path", () => {
  it("A: nulls the activeSlot and pushes Mosje to welloe[]", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      welloe: [],
    });

    const result = returnMosjeToWelloe(state, "player_1", 0);

    expect(result.players.player_1.activeSlots[0]).toBeNull();
    expect(result.players.player_1.welloe.length).toBe(1);
    expect(result.players.player_1.welloe[0].cardId).toBe("mosje_test");
    expect(result.players.player_1.welloe[0].mp).toBe(70);
    expect(result.players.player_1.welloe[0].level).toBe(2);
    expect(result.players.player_1.welloe[0].summonedByPiecie).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// B. No defeat side-effects
// ─────────────────────────────────────────────────────────────
describe("returnMosjeToWelloe — no defeat side-effects", () => {
  it("B: does NOT set isDefeated, does NOT add to discard, does NOT change game status", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      welloe: [],
    });

    const result = returnMosjeToWelloe(state, "player_1", 0);

    expect(result.players.player_1.welloe[0].isDefeated).not.toBe(true);
    const discardContainsMosjeTest = (result.players.player_1.discard as any[]).includes(
      "mosje_test"
    );
    expect(discardContainsMosjeTest).toBe(false);
    // status unchanged (no FINISHED)
    expect(result.status).not.toBe("FINISHED");
  });
});

// ─────────────────────────────────────────────────────────────
// C. Null slot guard — no-op
// ─────────────────────────────────────────────────────────────
describe("returnMosjeToWelloe — null slot guard", () => {
  it("C: returns state unchanged when slot is null", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      welloe: [],
    });

    const result = returnMosjeToWelloe(state, "player_1", 1);

    expect(result.players.player_1.welloe.length).toBe(0);
    expect(result.players.player_1.activeSlots[0]).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// D. endTurn sweep — returns when Piecie is gone
// ─────────────────────────────────────────────────────────────
describe("endTurn — Call of the Welloes sweep", () => {
  it("D: returns summoned Mosje to welloe[] when anchor Piecie is absent from piecieSlots", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      welloe: [],
      piecieSlots: [null, null, null, null],
    });

    const result = endTurn(state, "player_1");

    expect(result.players.player_1.activeSlots[0]).toBeNull();
    const welloe = result.players.player_1.welloe as any[];
    expect(welloe.some((w: any) => w.cardId === "mosje_test")).toBe(true);
  });

  it("E: leaves summoned Mosje in place when anchor Piecie is still in piecieSlots", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      welloe: [],
      piecieSlots: [
        { cardId: "piecie_call_of_welloes", type: "PIECIE" },
        null,
        null,
        null,
      ],
    });

    const result = endTurn(state, "player_1");

    // Mosje should still be in activeSlots[0] (not returned)
    expect(result.players.player_1.activeSlots[0]).not.toBeNull();
    expect(result.players.player_1.activeSlots[0]?.cardId).toBe("mosje_test");
    const welloe = result.players.player_1.welloe as any[];
    expect(welloe.some((w: any) => w.cardId === "mosje_test")).toBe(false);
  });
});
