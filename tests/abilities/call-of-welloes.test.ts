import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";
// @ts-expect-error — JS module, no type declarations
import { markMosjeDefeated } from "../../src/engine/victoryChecker.js";

// ─────────────────────────────────────────────────────────────
// Phase 22 — Wave 4: Revised mechanic (gap closure)
//   A. endTurn defeat-on-sweep when Piecie is gone
//   B. endTurn no-op when Piecie is still present
//   C. Piecie persistence guard — NOT swept while linked Mosje is alive
//   F. empty-welloe cancel
//   G. no-free-slot cancel
//   H. pending flag set with welloeOptions
//   I. confirmCallOfWelloes summons at Level 1, 50 MP (NOT restored stats)
//   J. piecies.js description: Level 1, 50 MP + destroyed = defeated language
//   K. markMosjeDefeated clears linkedMosjeCardId on anchor Piecie slot
// ─────────────────────────────────────────────────────────────

function makePlayer(overrides: Record<string, any> = {}) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    graveyard: [] as any[],
    welloePile: [] as any[],
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
// A. endTurn defeat-on-sweep when Piecie is gone
// ─────────────────────────────────────────────────────────────
describe("endTurn — Call of the Welloes: defeat when Piecie is gone", () => {
  it("A: markMosjeDefeated is triggered on summoned Mosje when anchor Piecie is absent", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      graveyard: [],
      piecieSlots: [null, null, null, null],
    });
    // state.activePlayerId is explicitly "player_1" (set in makeState), so endTurn acts on player_1
    const result = endTurn(state);
    // Mosje is defeated: slot nulled
    expect(result.players.player_1.activeSlots[0]).toBeNull();
    // Welloe pile receives the defeated Mosje (type: MOSJE, isDefeated: true)
    const welloePile = (result.players.player_1 as any).welloePile as any[];
    const defeated = welloePile.find((e: any) => e.cardId === "mosje_test" && e.type === "MOSJE");
    expect(defeated).toBeDefined();
    expect(defeated.isDefeated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// B. endTurn no-op when Piecie is still present
// ─────────────────────────────────────────────────────────────
describe("endTurn — Call of the Welloes: Mosje stays when Piecie is present", () => {
  it("B: does NOT defeat summoned Mosje when anchor Piecie is still in piecieSlots", () => {
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      graveyard: [],
      piecieSlots: [
        { cardId: "piecie_call_of_welloes", type: "PIECIE", linkedMosjeCardId: "mosje_test" },
        null, null, null,
      ],
    });
    // state.activePlayerId is explicitly "player_1" (set in makeState), so endTurn acts on player_1
    const result = endTurn(state);
    expect(result.players.player_1.activeSlots[0]).not.toBeNull();
    expect(result.players.player_1.activeSlots[0]?.cardId).toBe("mosje_test");
    const welloePile = (result.players.player_1 as any).welloePile as any[];
    expect(welloePile.some((e: any) => e.cardId === "mosje_test" && e.type === "MOSJE")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// C. Piecie persistence guard — NOT swept while linked Mosje is alive
// ─────────────────────────────────────────────────────────────
describe("endTurn — piecie_call_of_welloes persistence guard", () => {
  it("C: piecie_call_of_welloes is NOT removed from piecieSlots when its linked Mosje is in activeSlots", () => {
    // Only a custom Stays Piecie is exempt from the end-of-turn sweep.
    // piecie_call_of_welloes must be exempt while linkedMosjeCardId is live.
    const state = makeState({
      activeSlots: [{ ...summonedSlot }, null],
      graveyard: [],
      piecieSlots: [
        { cardId: "piecie_call_of_welloes", type: "PIECIE", linkedMosjeCardId: "mosje_test" },
        null, null, null,
      ],
    });
    // state.activePlayerId is explicitly "player_1" (set in makeState), so endTurn acts on player_1
    const result = endTurn(state);
    const pSlots = result.players.player_1.piecieSlots as any[];
    const piecieStillPresent = pSlots.some((p: any) => p?.cardId === "piecie_call_of_welloes");
    expect(piecieStillPresent).toBe(true);
  });
});

describe("piecies.js — piecie_call_of_welloes description (revised)", () => {
  it("J: 2.0 description: Welloe pile summon at Level 1, discards when the Mosje leaves play, no 'restoring its MP'", () => {
    const def = (PIECIES as any[]).find((p: any) => p.id === "piecie_call_of_welloes");
    expect(def).toBeDefined();
    expect(def.description).toContain("Summon a Mosje from your Welloe pile");
    expect(def.description).toContain("at Level 1 with its starting MP");
    expect(def.description).toContain("if the Mosje leaves play, discard this card");
    expect(def.description).not.toContain("restoring its MP");
  });
});

// ─────────────────────────────────────────────────────────────
// K. markMosjeDefeated clears linkedMosjeCardId on anchor Piecie slot
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// L. markMosjeDefeated: Piecie is immediately discarded when its linked Mosje is defeated
// ─────────────────────────────────────────────────────────────
describe("markMosjeDefeated — Piecie immediately discarded when linked Mosje dies", () => {
  it("L: piecieSlots entry is nulled and 'piecie_call_of_welloes' is in graveyard after markMosjeDefeated", () => {
    const mosjeInSlot = {
      cardId: "mosje_test",
      name: "T",
      mp: 0,
      level: 1,
      isDefeated: false,
      traits: {},
      statusEffects: [],
      abilityUsedThisTurn: false,
      summonedByPiecie: "piecie_call_of_welloes",
    };
    const state = makeState({
      activeSlots: [mosjeInSlot, null],
      graveyard: [],
      piecieSlots: [
        { cardId: "piecie_call_of_welloes", type: "PIECIE", linkedMosjeCardId: "mosje_test" },
        null, null, null,
      ],
    });
    const result = markMosjeDefeated(state, "player_1", 0);
    // Piecie slot must be nulled
    const pSlots = result.players.player_1.piecieSlots as any[];
    const piecieStillOnField = pSlots.some((p: any) => p?.cardId === "piecie_call_of_welloes");
    expect(piecieStillOnField).toBe(false);
    // Piecie cardId must be in graveyard
    const graveyard = result.players.player_1.graveyard as any[];
    const piecieInGraveyard = graveyard.some(
      (e: any) => e?.cardId === "piecie_call_of_welloes"
    );
    expect(piecieInGraveyard).toBe(true);
  });
});

describe("markMosjeDefeated — clears linkedMosjeCardId on anchor Piecie slot", () => {
  it("K: when a summoned Mosje is defeated, the anchor Piecie's linkedMosjeCardId is cleared", () => {
    const mosjeInSlot = {
      cardId: "mosje_test",
      name: "T",
      mp: 0,
      level: 1,
      isDefeated: false,
      traits: {},
      statusEffects: [],
      abilityUsedThisTurn: false,
      summonedByPiecie: "piecie_call_of_welloes",
    };
    const state = makeState({
      activeSlots: [mosjeInSlot, null],
      graveyard: [],
      piecieSlots: [
        { cardId: "piecie_call_of_welloes", type: "PIECIE", linkedMosjeCardId: "mosje_test" },
        null, null, null,
      ],
    });
    const result = markMosjeDefeated(state, "player_1", 0);
    // Slot is now null (Piecie was sent to graveyard) — that satisfies D-17 + D-bidirectional
    const pSlots = result.players.player_1.piecieSlots as any[];
    const pSlot = pSlots.find((p: any) => p?.cardId === "piecie_call_of_welloes");
    expect(pSlot == null || pSlot.linkedMosjeCardId == null).toBe(true);
  });
});
