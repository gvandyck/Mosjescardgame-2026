import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
import { build, finish } from "../helpers/quest56.js";
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from "../../src/data/quests.js";

// ─────────────────────────────────────────────────────────────
// Phase 21 Plan 01 — wire 3 engine-doable quest behaviors that were
// previously DEFERRED to a UI hook (they are pure state changes):
//   1. drawOnSuccess  — V4 resolveQuest draw-2; replaced in 2.0 by Cheat code (win draws 1).
//   2. opponentLoseMP — V4 Elimination Challenge (now disabled); replaced in 2.0 by the win jab (quest-jab.test.ts).
//   3. V4 quest_req_hack_mainframe (Hacker/FPS -1 threshold) deleted with the V4 thresholds;
//      2.0 counterpart: quest-dice.test.ts (dice = stars of the rolled trait).
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

// ─────────────────────────────────────────────────────────────
// drawOnSuccess -> 2.0 Cheat code (win draws 1 card; a fail draws nothing)
// V4 "draw 2 on success" (Artistic Expression / Late Night Questing) is gone from the Card List.
// 2.0 counterparts: quest-extras.test.ts "Cheat code win draws 1; empty deck ...".
// The V4 "opponentLoseMP" block (Elimination Challenge, now disabled) is covered by the 2.0 win
// jab in quest-jab.test.ts. Both V4 describes were removed with resolveQuest.
// ─────────────────────────────────────────────────────────────
describe("2.0 Quest draw on win (Cheat code)", () => {
  it("a failed Cheat code attempt draws nothing", () => {
    const { s, q } = build("cheat_code", { p1: { deck: [{ cardId: "a" }, { cardId: "b" }], hand: [] } });
    const out = finish(s, q, false).players.player_1;
    expect(out.hand).toHaveLength(0);
    expect(out.deck).toHaveLength(2);
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
// 2.0 attempt (rollQuestAttempt + resolveQuestAttempt) — bonus MP application (armed questBonusMP + live
// partner-synergy), both gated to success only. Base amounts come from the Card List:
// Quick Thinking (Steady, Mental) +25 / -15, Arm Wrestling (Skilled, Physical) +40 / -30.
// ─────────────────────────────────────────────────────────────
describe("2.0 Quest attempt — bonus MP application", () => {
  // Every case stays under the 100 MP level-up threshold (gain and bonus are separate gainMP calls).
  function withPhysical(state: any) {
    // Arm Wrestling is Skilled (2 dice): 2 Physical stars give the dice to win it.
    for (const s of state.players.player_1.activeSlots) if (s) s.traits = { physical: 2 };
    return state;
  }

  it("applies and resets the one-shot questBonusMP flag on success", () => {
    const state = makeState({ p1mp: 20 });
    state.players.player_1.questBonusMP = 10;

    const next = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: true });

    expect(next.players.player_1.activeSlots[0].mp).toBe(55); // 20 + 25 + 10
    expect(next.players.player_1.questBonusMP).toBe(0);
  });

  it("leaves questBonusMP ARMED (unconsumed) after a failed attempt", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.questBonusMP = 10;

    const next = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: false });

    expect(next.players.player_1.questBonusMP).toBe(10);
  });

  it("applies the West+Cless Physical-quest synergy bonus on success", () => {
    const state = withPhysical(makeState({ p1mp: 50 }));
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 30),
      makeSlot("mosje_azn_cless", 30),
    ];
    withPhysical(state);

    const next = forceQuestResult(state, "player_1", { questId: "quest_arm_wrestling", win: true });

    expect(next.players.player_1.activeSlots[0].mp).toBe(85); // 30 + 40 + 15
  });

  it("does NOT apply the synergy bonus for a non-Physical quest", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 30),
      makeSlot("mosje_azn_cless", 30),
    ];

    const next = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: true });

    expect(next.players.player_1.activeSlots[0].mp).toBe(55); // 30 + 25, no synergy
  });

  it("stacks the armed bonus AND the partner synergy together", () => {
    const state = makeState({ p1mp: 50 });
    state.players.player_1.questBonusMP = 10;
    state.players.player_1.activeSlots = [
      makeSlot("mosje_martin_senor_west", 20),
      makeSlot("mosje_azn_cless", 20),
    ];
    withPhysical(state);

    const next = forceQuestResult(state, "player_1", { questId: "quest_arm_wrestling", win: true });

    expect(next.players.player_1.activeSlots[0].mp).toBe(85); // 20 + 40 + 10 + 15
  });
});
