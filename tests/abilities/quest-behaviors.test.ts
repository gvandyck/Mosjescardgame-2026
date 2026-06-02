import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest, quest_req_hack_mainframe } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from "../../src/data/quests.js";

// ─────────────────────────────────────────────────────────────
// Phase 21 Plan 01 — wire 3 engine-doable quest behaviors that were
// previously DEFERRED to a UI hook (they are pure state changes):
//   1. drawOnSuccess  — resolveQuest draws N cards from the questing
//      player's deck into their hand on success (Artistic Expression,
//      Late Night Questing).
//   2. opponentLoseMP — resolveQuest drains an opponent's first active
//      Mosje on success (Elimination Challenge), via loseMP, skipped
//      under The Void.
//   3. quest_req_hack_mainframe — the Hacker/FPS -1 threshold bonus must
//      read the populated id field (cardId), not the always-undefined
//      mosje.mosjeId.
// ─────────────────────────────────────────────────────────────

function makeSlot(cardId: string, mp = 100, level = 1) {
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

function makePlayer(slotCardId: string, mp = 100) {
  return {
    hand: [] as any[],
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

function makeState(opts: { p1mp?: number; p2mp?: number; activePlace?: any } = {}) {
  return {
    activePlayerId: "player_1",
    activePlace: opts.activePlace ?? null,
    turnNumber: 3,
    sharedGeneralQuestDeck: [] as any[],
    players: {
      player_1: makePlayer("mosje_self", opts.p1mp ?? 100),
      player_2: makePlayer("mosje_opponent", opts.p2mp ?? 100),
    },
  } as any;
}

// A bare questCard literal so the resolveQuest behavior tests do not depend
// on the real quest definitions (those are asserted separately below).
function questCard(extra: Record<string, any> = {}) {
  return {
    id: "quest_test",
    requirementId: "quest_req_test",
    successMP: 0,
    failMP: 0,
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────
// drawOnSuccess
// ─────────────────────────────────────────────────────────────
describe("resolveQuest — drawOnSuccess", () => {
  it("draws N cards to the questing player's hand on success", () => {
    const state = makeState();
    state.players.player_1.deck = [
      { cardId: "c1" },
      { cardId: "c2" },
      { cardId: "c3" },
    ];

    const next = resolveQuest(state, "player_1", questCard({ drawOnSuccess: 2 }), true);

    expect(next.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["c1", "c2"]);
    expect(next.players.player_1.deck.map((c: any) => c.cardId)).toEqual(["c3"]);
  });

  it("does NOT draw on failure", () => {
    const state = makeState();
    state.players.player_1.deck = [{ cardId: "c1" }, { cardId: "c2" }];

    const next = resolveQuest(state, "player_1", questCard({ drawOnSuccess: 2 }), false);

    expect(next.players.player_1.hand.length).toBe(0);
    expect(next.players.player_1.deck.length).toBe(2);
  });

  it("does not draw when the deck is empty (no crash, hand unchanged)", () => {
    const state = makeState();
    state.players.player_1.deck = [];

    const next = resolveQuest(state, "player_1", questCard({ drawOnSuccess: 2 }), true);

    expect(next.players.player_1.hand.length).toBe(0);
    expect(next.players.player_1.deck.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// opponentLoseMP (Elimination Challenge)
// ─────────────────────────────────────────────────────────────
describe("resolveQuest — opponentLoseMP", () => {
  it("drains the opponent's first active Mosje on success", () => {
    const state = makeState({ p2mp: 100 });

    const next = resolveQuest(state, "player_1", questCard({ opponentLoseMP: 30 }), true);

    expect(next.players.player_2.activeSlots[0].mp).toBe(70);
  });

  it("does NOT drain on failure", () => {
    const state = makeState({ p2mp: 100 });

    const next = resolveQuest(state, "player_1", questCard({ opponentLoseMP: 30 }), false);

    expect(next.players.player_2.activeSlots[0].mp).toBe(100);
  });

  it("skips the drain under The Void", () => {
    const state = makeState({ p2mp: 100, activePlace: "place_the_void" });

    const next = resolveQuest(state, "player_1", questCard({ opponentLoseMP: 30 }), true);

    expect(next.players.player_2.activeSlots[0].mp).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────
// quest_req_hack_mainframe — Hacker/FPS -1 threshold via cardId
// ─────────────────────────────────────────────────────────────
describe("quest_req_hack_mainframe — FPS/Hacker threshold bonus", () => {
  it("gives the -1 threshold for a Mosje whose cardId includes 'fps'", () => {
    // technical < 2 → base threshold 6; FPS bonus → 5.
    const mosje = { cardId: "mosje_fps_west", traits: { technical: 0 } };
    const result = quest_req_hack_mainframe({}, mosje);
    expect(result.threshold).toBe(5);
  });

  it("does NOT give the bonus for a non-FPS / non-Hacker cardId", () => {
    const mosje = { cardId: "mosje_gandoe", traits: { technical: 0 } };
    const result = quest_req_hack_mainframe({}, mosje);
    expect(result.threshold).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────
// Real quest defs carry the new data fields
// ─────────────────────────────────────────────────────────────
describe("quest defs carry the new data fields", () => {
  it("quest_artistic_expression.drawOnSuccess === 2", () => {
    const q = QUESTS.find((x: any) => x.id === "quest_artistic_expression");
    expect(q?.drawOnSuccess).toBe(2);
  });

  it("quest_late_night_questing.drawOnSuccess === 2", () => {
    const q = QUESTS.find((x: any) => x.id === "quest_late_night_questing");
    expect(q?.drawOnSuccess).toBe(2);
  });

  it("quest_elimination_challenge.opponentLoseMP === 30", () => {
    const q = QUESTS.find((x: any) => x.id === "quest_elimination_challenge");
    expect(q?.opponentLoseMP).toBe(30);
  });
});
