import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { endTurn, returnMosjeToWelloe, confirmCallOfWelloes } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { effect_call_of_welloes } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";

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

// ─────────────────────────────────────────────────────────────
// Wave 2: effect_call_of_welloes + confirmCallOfWelloes + description
//   F. empty-welloe cancel
//   G. no-free-slot cancel
//   H. pending flag set with welloeOptions
//   I. summon restores welloe-recorded stats + wires tracking fields
//   J. piecies.js description corrected
// ─────────────────────────────────────────────────────────────

describe("effect_call_of_welloes — cancel guards", () => {
  it("F: returns _callOfWelloesCancel === true when welloe[] is empty", () => {
    const state = makeState({
      welloe: [],
      activeSlots: [null, null],
    });
    const result = effect_call_of_welloes(state, "player_1");
    expect(result._callOfWelloesCancel).toBe(true);
    expect(result._callOfWelloesPending).toBeUndefined();
  });

  it("G: returns _callOfWelloesCancel === true when both activeSlots are occupied", () => {
    const occupied = { cardId: "mosje_a", name: "A", mp: 80, level: 1 };
    const state = makeState({
      welloe: [{ cardId: "mosje_x", name: "X", mp: 50, level: 1 }],
      activeSlots: [occupied, { ...occupied, cardId: "mosje_b" }],
    });
    const result = effect_call_of_welloes(state, "player_1");
    expect(result._callOfWelloesCancel).toBe(true);
    expect(result._callOfWelloesPending).toBeUndefined();
  });
});

describe("effect_call_of_welloes — pending flag", () => {
  it("H: sets _callOfWelloesPending with playerId and welloeOptions when activatable", () => {
    const state = makeState({
      welloe: [{ cardId: "mosje_x", name: "X", mp: 60, level: 2 }],
      activeSlots: [{ cardId: "mosje_a", name: "A", mp: 80, level: 1 }, null],
    });
    const result = effect_call_of_welloes(state, "player_1");
    expect(result._callOfWelloesCancel).toBeUndefined();
    expect(result._callOfWelloesPending).toBeDefined();
    expect(result._callOfWelloesPending.playerId).toBe("player_1");
    const opts = result._callOfWelloesPending.welloeOptions as any[];
    expect(opts.length).toBe(1);
    expect(opts[0].cardId).toBe("mosje_x");
    expect(opts[0].mp).toBe(60);
    expect(opts[0].level).toBe(2);
  });
});

describe("confirmCallOfWelloes — summon executor", () => {
  it("I: places Mosje in free activeSlot with restored stats, sets summonedByPiecie, sets linkedMosjeCardId, removes from welloe[]", () => {
    const welloeRecord = {
      cardId: "mosje_x",
      name: "X",
      subtype: "FIGHTING",
      traits: { physical: 2 },
      mp: 60,
      level: 2,
      statusEffects: [] as any[],
    };
    const state = makeState({
      welloe: [welloeRecord],
      activeSlots: [{ cardId: "mosje_a", name: "A", mp: 80, level: 1 }, null],
      piecieSlots: [{ cardId: "piecie_call_of_welloes", type: "PIECIE" }, null, null, null],
    });

    const { state: s, success } = confirmCallOfWelloes(state, "player_1", "mosje_x");

    expect(success).toBe(true);

    // Mosje placed in a free slot
    const slots = s.players.player_1.activeSlots as any[];
    const placed = slots.find((sl: any) => sl?.cardId === "mosje_x");
    expect(placed).toBeDefined();
    expect(placed.mp).toBe(60);
    expect(placed.level).toBe(2);
    expect(placed.summonedByPiecie).toBe("piecie_call_of_welloes");

    // Removed from welloe[]
    const welloe = s.players.player_1.welloe as any[];
    expect(welloe.some((w: any) => w.cardId === "mosje_x")).toBe(false);

    // Anchor link on piecieSlot
    const pSlot = (s.players.player_1.piecieSlots as any[]).find(
      (p: any) => p?.cardId === "piecie_call_of_welloes"
    );
    expect(pSlot?.linkedMosjeCardId).toBe("mosje_x");
  });
});

describe("piecies.js — piecie_call_of_welloes description", () => {
  it("J: description includes 'restoring its MP and Level' and does NOT include 'Level 1, 0 MP'", () => {
    const def = (PIECIES as any[]).find((p: any) => p.id === "piecie_call_of_welloes");
    expect(def).toBeDefined();
    expect(def.description).toContain("restoring its MP and Level");
    expect(def.description).not.toContain("Level 1, 0 MP");
  });
});
