import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { checkQuestCondition } from "../../src/engine/quests/checkQuestCondition.js";
// @ts-expect-error — JS module, no type declarations
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from "../../src/data/quests.js";
// @ts-expect-error — JS module, no type declarations
import { playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";

// ─────────────────────────────────────────────────────────────
// Phase 22 quest gates, rewritten for Obby 2.0 (Phase 56):
//   1. Speed Run gate (Chain Master is disabled in 2.0) on the 2.0 condition table (checkQuestCondition)
//      - V4 pieciesPlayedThisTurn / all-time-discard gates are gone; counterpart: quest-costs.test.ts
//   2. Sustained Assault has no gate in 2.0 (V4 attackPieciePlayedThisTurn gate removed)
//   3. attackPieciePlayedThisTurn tracking in playPiecie / startTurn (engine flag, unchanged)
//   4. Larry Temmen — description matches binary 2-way system
// ─────────────────────────────────────────────────────────────

function makePlayer(overrides: Record<string, any> = {}) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    activeSlots: [
      {
        cardId: "mosje_self",
        name: "Test Mosje",
        mp: 100,
        level: 1,
        isDefeated: false,
        traits: { physical: 0, technical: 0 },
        statusEffects: [],
        abilityUsedThisTurn: false,
      },
      null,
    ],
    piecieSlots: [null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    pieciesPlayedThisTurn: 0,
    attackPieciePlayedThisTurn: false,
    ...overrides,
  };
}

function makeState(playerOverrides: Record<string, any> = {}, slotOverrides: Record<string, any> = {}) {
  const p1 = makePlayer(playerOverrides);
  Object.assign(p1.activeSlots[0] as any, slotOverrides);
  return {
    activePlayerId: "player_1",
    activePlace: null,
    turnNumber: 3,
    players: { player_1: p1, player_2: makePlayer() },
  } as any;
}

const ok = (state: any, id: string) => checkQuestCondition(state, "player_1", 0, getQuestDef(id)).ok;

describe("Chain Master — disabled in 2.0 (V4 pieciesPlayedThisTurn gate removed)", () => {
  it("is disabled in the Card List data", () => {
    expect(getQuestDef("quest_chain_master").disabled).toBe(true);
  });
});

describe("Speed Run — 2.0 gate: activate 2 ready Piecies this turn", () => {
  it("blocks with 0 or 1 activations", () => {
    expect(ok(makeState({ piecieActivationsThisTurn: 0 }), "quest_speed_run")).toBe(false);
    expect(ok(makeState({ piecieActivationsThisTurn: 1 }), "quest_speed_run")).toBe(false);
  });
  it("allows with 2 activations", () => {
    expect(ok(makeState({ piecieActivationsThisTurn: 2 }), "quest_speed_run")).toBe(true);
  });
});

describe("Sustained Assault — 2.0: steady band, no condition (V4 attack-Piecie gate removed)", () => {
  it("has no costId and is not disabled", () => {
    const q = getQuestDef("quest_sustained_assault");
    expect(q.costId).toBeNull();
    expect(q.disabled).toBeUndefined();
  });
  it("attackPieciePlayedThisTurn no longer gates it", () => {
    expect(ok(makeState({ attackPieciePlayedThisTurn: false }), "quest_sustained_assault")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. attackPieciePlayedThisTurn — set by playPiecie for ATTACK subtype
// ─────────────────────────────────────────────────────────────
describe("playPiecie — attackPieciePlayedThisTurn tracking", () => {
  function makePlayableState() {
    return {
      activePlayerId: "player_1",
      activePlace: null,
      activePlacePlayedBy: null,
      turnNumber: 3,
      players: {
        player_1: {
          hand: [{ cardId: "super_saiyan_mos", type: "PIECIE" }],
          deck: [],
          discard: [],
          activeSlots: [
            { cardId: "mosje_self", mp: 100, level: 1, isDefeated: false, traits: {}, statusEffects: [] },
            null,
          ],
          piecieSlots: [null, null, null, null],
          pieciesPlayedThisTurn: 0,
          attackPieciePlayedThisTurn: false,
          lastCardPlayedType: null,
        },
        player_2: { activeSlots: [], piecieSlots: [] },
      },
    } as any;
  }

  it("sets attackPieciePlayedThisTurn = true when ATTACK subtype Piecie is played", () => {
    const state = makePlayableState();
    const cardRef = { cardId: "super_saiyan_mos", type: "PIECIE" };
    const cardDef = { cardId: "super_saiyan_mos", subtype: "ATTACK" };
    const result = playPiecie(state, "player_1", cardRef, cardDef);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.attackPieciePlayedThisTurn).toBe(true);
  });

  it("does NOT set attackPieciePlayedThisTurn for non-ATTACK Piecie", () => {
    const state = makePlayableState();
    const cardRef = { cardId: "super_saiyan_mos", type: "PIECIE" };
    const cardDef = { cardId: "super_saiyan_mos", subtype: "UTILITY" };
    const result = playPiecie(state, "player_1", cardRef, cardDef);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.attackPieciePlayedThisTurn).toBe(false);
  });

  it("does NOT set attackPieciePlayedThisTurn when cardDef has no subtype", () => {
    const state = makePlayableState();
    const cardRef = { cardId: "super_saiyan_mos", type: "PIECIE" };
    const cardDef = { cardId: "super_saiyan_mos" };
    const result = playPiecie(state, "player_1", cardRef, cardDef);
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.attackPieciePlayedThisTurn).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 3b. startTurn — resets attackPieciePlayedThisTurn
// ─────────────────────────────────────────────────────────────
describe("startTurn — attackPieciePlayedThisTurn reset", () => {
  it("resets attackPieciePlayedThisTurn to false at start of turn", () => {
    const state = {
      activePlayerId: "player_1",
      turnNumber: 3,
      activePlace: null,
      activePlacePlayedBy: null,
      players: {
        player_1: {
          hand: [],
          deck: [{ cardId: "c1", type: "PIECIE" }],
          discard: [],
          activeSlots: [
            { cardId: "mosje_self", mp: 100, level: 1, isDefeated: false, traits: {}, statusEffects: [], strategicInsightCooldown: 0 },
            null,
          ],
          piecieSlots: [null, null, null, null],
          pieciesPlayedThisTurn: 3,
          attackPieciePlayedThisTurn: true,
          questsCompletedThisTurn: 0,
          questsAttemptedThisTurn: 0,
          hasAttemptedQuestThisTurn: false,
          hasRerolledDieThisTurn: false,
          lastCardPlayedType: "PIECIE",
          instantPiecieThisTurn: false,
          chainReactionActive: false,
          abilityDoubleTrigger: false,
          drawsThisTurn: 0,
          pieciesActivatedThisTurn: 0,
          actionsThisTurn: [],
          freePiecieActivationAvailable: false,
        },
        player_2: {
          hand: [],
          deck: [],
          discard: [],
          activeSlots: [null],
          piecieSlots: [null, null, null, null],
        },
      },
    } as any;

    const result = startTurn(state, "player_1");
    expect(result.players.player_1.attackPieciePlayedThisTurn).toBe(false);
    expect(result.players.player_1.pieciesPlayedThisTurn).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Larry Temmen — description matches binary 2-way system
// ─────────────────────────────────────────────────────────────
describe("Larry Temmen quest definition", () => {
  const larryTemmen = QUESTS.find((q: any) => q.id === "quest_larry_temmen");

  it("exists in QUESTS", () => {
    expect(larryTemmen).toBeDefined();
  });

  it("description reflects binary outcome (not 3-way)", () => {
    expect(larryTemmen.description).not.toMatch(/3-4/);
    expect(larryTemmen.description).not.toMatch(/nothing/i);
    // Should clearly state success and fail outcomes
    expect(larryTemmen.description).toMatch(/5\+|roll 5/i);
  });

  it("requirementDescription reflects binary outcome", () => {
    expect(larryTemmen.requirementDescription).not.toMatch(/3-4/);
    expect(larryTemmen.requirementDescription).not.toMatch(/nothing/i);
  });
});
