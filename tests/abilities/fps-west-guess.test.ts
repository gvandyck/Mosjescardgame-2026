import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_fps_west_tactical_analysis } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// ─────────────────────────────────────────────────────────────
// Phase 19 Plan 01 — FPS West "Tactical Analysis" reworked into a
// card-type guessing game against the opponent's hand.
//   Correct guess (_pendingTargets.fpsWestGuessCorrect === true):  +70 MP
//   Wrong guess   (_pendingTargets.fpsWestGuessCorrect === false): -20 MP
// The ±MP MUST route through gainMP/loseMP (visible + logged).
// The old behavior (draw 1 card + set opponentHandPeeked) is dropped.
//
// NOTE on MP values: gainMP runs checkLevelUp (level-up at mp >= 100). To keep
// the assertions about the +70 / -20 delta unambiguous, FPS West starts at
// mp = 25 so neither branch crosses a level-up (100) or clamp (0) boundary:
//   correct: 25 + 70 = 95   (no level-up)
//   wrong:   25 - 20 =  5   (no clamp)
// (The plan's <action> illustrated 120/30 from a mp=50 start, but that start
//  triggers a level-up via gainMP — 50+70=120 → level up → mp 20. Using mp=25
//  tests the same +70/-20 contract without the level-up edge.)
// ─────────────────────────────────────────────────────────────

function makeSlot(cardId: string, mp = 25, level = 1) {
  return {
    cardId,
    name: cardId,
    mp,
    level,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
  };
}

function makePlayer(slotCardId: string, mp = 25, hand: any[] = []) {
  return {
    hand,
    deck: [] as any[],
    discard: [] as any[],
    activeSlots: [makeSlot(slotCardId, mp), null],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
  };
}

function makeState(fpsWestMP = 25) {
  return {
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: makePlayer("mosje_fps_west", fpsWestMP, [
        { cardId: "piecie_kannetje_melk" },
      ]),
      player_2: makePlayer("mosje_opponent", 100, [
        { cardId: "piecie_kannetje_melk" },
      ]),
    },
  } as any;
}

describe("FPS West Tactical Analysis — correct guess rewards +70 MP", () => {
  it("gives FPS West's own slot +70 MP when fpsWestGuessCorrect is true", () => {
    const state = makeState(25);
    state._pendingTargets = { fpsWestGuessCorrect: true };

    const next = ability_fps_west_tactical_analysis(state, "player_1");

    // 25 + 70 = 95 (no level-up)
    expect(next.players.player_1.activeSlots[0].mp).toBe(95);
    expect(next.players.player_1.activeSlots[0].level).toBe(1);
    // flag consumed so it cannot be re-read
    expect(next._pendingTargets?.fpsWestGuessCorrect).toBeUndefined();
  });
});

describe("FPS West Tactical Analysis — wrong guess penalises -20 MP", () => {
  it("removes 20 MP from FPS West's own slot when fpsWestGuessCorrect is false", () => {
    const state = makeState(25);
    state._pendingTargets = { fpsWestGuessCorrect: false };

    const next = ability_fps_west_tactical_analysis(state, "player_1");

    // 25 - 20 = 5
    expect(next.players.player_1.activeSlots[0].mp).toBe(5);
    expect(next.players.player_1.activeSlots[0].level).toBe(1);
    expect(next._pendingTargets?.fpsWestGuessCorrect).toBeUndefined();
  });
});

describe("FPS West Tactical Analysis — dead flags removed", () => {
  it("does NOT draw a card (hand length unchanged) and does NOT set opponentHandPeeked", () => {
    const state = makeState(25);
    state._pendingTargets = { fpsWestGuessCorrect: true };
    const handBefore = state.players.player_1.hand.length;

    const next = ability_fps_west_tactical_analysis(state, "player_1");

    expect(next.players.player_1.hand.length).toBe(handBefore);
    expect(next.players.player_1.opponentHandPeeked).not.toBe(true);
  });
});

describe("FPS West Tactical Analysis — requires a guess", () => {
  it("throws when no fpsWestGuessCorrect is provided", () => {
    const state = makeState(25);
    state._pendingTargets = {};

    expect(() => ability_fps_west_tactical_analysis(state, "player_1")).toThrow();
  });
});

describe("FPS West ability description — guessing game text", () => {
  it("contains 'Guess' and '70', and drops the legacy 'predict' / 'Pay 10 MP' wording", () => {
    const west = MOSJES.find((m: any) => m.id === "mosje_fps_west");
    expect(west).toBeTruthy();
    expect(west.abilityDescription).toContain("Guess");
    expect(west.abilityDescription).toContain("70");
    expect(west.abilityDescription).not.toContain("predict");
    expect(west.abilityDescription).not.toContain("Pay 10 MP");
  });
});
