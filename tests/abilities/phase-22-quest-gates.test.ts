import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import {
  quest_req_chain_master,
  quest_req_speed_run,
  quest_req_sustained_assault,
} from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from "../../src/data/quests.js";
// @ts-expect-error — JS module, no type declarations
import { playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";

// ─────────────────────────────────────────────────────────────
// Phase 22 — Bucket D quest gate fixes:
//   1. Chain Master  — uses pieciesPlayedThisTurn (not all-time discard)
//   2. Speed Run     — gates on pieciesPlayedThisTurn >= 2 (total discard proxy)
//   3. Sustained Assault — gates on attackPieciePlayedThisTurn flag
//   4. Larry Temmen  — description matches binary 2-way system
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

const BASE_MOSJE = { traits: { physical: 1, technical: 1 } };
const TECHNICAL_3_MOSJE = { traits: { physical: 1, technical: 3 } };
const PHYSICAL_3_MOSJE = { traits: { physical: 3, technical: 1 } };

// ─────────────────────────────────────────────────────────────
// 1. Chain Master — pieciesPlayedThisTurn gate
// ─────────────────────────────────────────────────────────────
describe("quest_req_chain_master", () => {
  it("blocks attempt when pieciesPlayedThisTurn < 3", () => {
    const state = makeState({ pieciesPlayedThisTurn: 2 });
    const result = quest_req_chain_master(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(false);
  });

  it("blocks attempt when pieciesPlayedThisTurn = 0 even with Piecies in all-time discard", () => {
    const state = makeState({
      pieciesPlayedThisTurn: 0,
      discard: [
        { cardId: "p1", type: "PIECIE" },
        { cardId: "p2", type: "PIECIE" },
        { cardId: "p3", type: "PIECIE" },
        { cardId: "p4", type: "PIECIE" },
      ],
    });
    const result = quest_req_chain_master(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(false);
  });

  it("allows attempt when pieciesPlayedThisTurn >= 3", () => {
    const state = makeState({ pieciesPlayedThisTurn: 3 });
    const result = quest_req_chain_master(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(3);
    expect(typeof result.diceRoll).toBe("number");
  });

  it("allows attempt when pieciesPlayedThisTurn = 5 (more than needed)", () => {
    const state = makeState({ pieciesPlayedThisTurn: 5 });
    const result = quest_req_chain_master(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Speed Run — pieciesPlayedThisTurn >= 2 gate (early-turn proxy)
// ─────────────────────────────────────────────────────────────
describe("quest_req_speed_run", () => {
  it("blocks attempt when pieciesPlayedThisTurn >= 2 (not early in turn)", () => {
    const state = makeState({ pieciesPlayedThisTurn: 2 });
    const result = quest_req_speed_run(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(false);
  });

  it("allows attempt when pieciesPlayedThisTurn = 0 (early in turn)", () => {
    const state = makeState({ pieciesPlayedThisTurn: 0 });
    const result = quest_req_speed_run(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(5);
  });

  it("allows attempt when pieciesPlayedThisTurn = 1 (still early)", () => {
    const state = makeState({ pieciesPlayedThisTurn: 1 });
    const result = quest_req_speed_run(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
  });

  it("Technical ★★★ reduces threshold to 3", () => {
    const state = makeState({ pieciesPlayedThisTurn: 0 });
    const result = quest_req_speed_run(null, TECHNICAL_3_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Sustained Assault — attackPieciePlayedThisTurn flag gate
// ─────────────────────────────────────────────────────────────
describe("quest_req_sustained_assault", () => {
  it("blocks attempt when attackPieciePlayedThisTurn is false", () => {
    const state = makeState({ attackPieciePlayedThisTurn: false });
    const result = quest_req_sustained_assault(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(false);
  });

  it("allows attempt when attackPieciePlayedThisTurn is true", () => {
    const state = makeState({ attackPieciePlayedThisTurn: true });
    const result = quest_req_sustained_assault(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(typeof result.diceRoll).toBe("number");
  });

  it("Physical ★★★ reduces threshold to 2", () => {
    const state = makeState({ attackPieciePlayedThisTurn: true });
    const result = quest_req_sustained_assault(null, PHYSICAL_3_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(2);
  });

  it("Physical ★ uses threshold 4", () => {
    const state = makeState({ attackPieciePlayedThisTurn: true });
    const result = quest_req_sustained_assault(null, BASE_MOSJE, state);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. attackPieciePlayedThisTurn — set by playPiecie for ATTACK subtype
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
// 5. startTurn — resets attackPieciePlayedThisTurn
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
// 6. Larry Temmen — description matches binary 2-way system
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
