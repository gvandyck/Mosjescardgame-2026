import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest, quest_req_hack_mainframe, getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
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

  it("quest_arm_wrestling.category === 'Physical' (used by the partner-synergy bonus)", () => {
    const q = QUESTS.find((x: any) => x.id === "quest_arm_wrestling");
    expect(q?.category).toBe("Physical");
  });
});

// ─────────────────────────────────────────────────────────────
// getPartnerSynergyQuestBonus — U6 stack step 4 (live board-state check,
// not consumed like questBonusMP). West + Cless: "Physical Quests give
// +15 bonus MP" when both are active — previously declared in mosjes.js
// but never mechanically applied (getActiveSynergies() only ever drove
// the hardcoded Binti+Coert FOOD-double check).
// ─────────────────────────────────────────────────────────────
describe("getPartnerSynergyQuestBonus", () => {
  function stateWithActive(cardIds: string[]) {
    return {
      players: {
        player_1: {
          activeSlots: cardIds.map((id) => makeSlot(id, 50)),
        },
      },
    } as any;
  }

  it("returns +15 for a Physical quest when West AND Cless are both active", () => {
    const state = stateWithActive(["mosje_martin_senor_west", "mosje_azn_cless"]);
    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical")).toBe(15);
  });

  it("returns 0 when only one of the pair is active", () => {
    const state = stateWithActive(["mosje_martin_senor_west"]);
    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical")).toBe(0);
  });

  it("returns 0 for a non-Physical category even with both active", () => {
    const state = stateWithActive(["mosje_martin_senor_west", "mosje_azn_cless"]);
    expect(getPartnerSynergyQuestBonus(state, "player_1", "Mental")).toBe(0);
  });

  it("ignores a defeated partner", () => {
    const state = stateWithActive(["mosje_martin_senor_west", "mosje_azn_cless"]);
    state.players.player_1.activeSlots[1].isDefeated = true;
    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical")).toBe(0);
  });

  it("returns 0 with no category", () => {
    const state = stateWithActive(["mosje_martin_senor_west", "mosje_azn_cless"]);
    expect(getPartnerSynergyQuestBonus(state, "player_1", undefined)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// resolveQuest — bonus MP application (armed questBonusMP + live
// partner-synergy), both gated to success only.
// ─────────────────────────────────────────────────────────────
describe("resolveQuest — bonus MP application", () => {
  // Every case below stays comfortably under the 100 MP level-up threshold —
  // resolveQuest applies successMP and the bonus as TWO separate gainMP
  // calls, so crossing 100 between them would pull in checkLevelUp's carry-
  // over math, which isn't what these tests are about.
  it("applies and resets the one-shot questBonusMP flag on success", () => {
    const state = makeState({ p1mp: 20 });
    state.players.player_1.questBonusMP = 10;

    const next = resolveQuest(state, "player_1", questCard({ successMP: 30 }), true);

    expect(next.players.player_1.activeSlots[0].mp).toBe(60); // 20 + 30 + 10
    expect(next.players.player_1.questBonusMP).toBe(0);
  });

  it("leaves questBonusMP ARMED (unconsumed) after a failed attempt", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.questBonusMP = 10;

    const next = resolveQuest(state, "player_1", questCard({ failMP: -10 }), false);

    expect(next.players.player_1.questBonusMP).toBe(10);
  });

  it("applies the West+Cless Physical-quest synergy bonus on success", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 30),
      makeSlot("mosje_azn_cless", 30),
    ];

    const next = resolveQuest(
      state, "player_1",
      questCard({ id: "quest_test_physical", category: "Physical", successMP: 30 }),
      true, 0
    );

    expect(next.players.player_1.activeSlots[0].mp).toBe(75); // 30 + 30 + 15
  });

  it("does NOT apply the synergy bonus for a non-Physical quest", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 30),
      makeSlot("mosje_azn_cless", 30),
    ];

    const next = resolveQuest(
      state, "player_1",
      questCard({ id: "quest_test_mental", category: "Mental", successMP: 30 }),
      true, 0
    );

    expect(next.players.player_1.activeSlots[0].mp).toBe(60); // 30 + 30, no synergy
  });

  it("stacks the armed bonus AND the partner synergy together", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.questBonusMP = 10;
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 20),
      makeSlot("mosje_azn_cless", 20),
    ];

    const next = resolveQuest(
      state, "player_1",
      questCard({ id: "quest_test_physical2", category: "Physical", successMP: 20 }),
      true, 0
    );

    expect(next.players.player_1.activeSlots[0].mp).toBe(65); // 20 + 20 + 10 + 15
  });
});
