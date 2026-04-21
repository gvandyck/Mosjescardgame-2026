import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { resolvePrimitive } from "../../src/effects/registry.js";
import { BATTLE_CONCERT } from "../../src/cards/piecies/utility/battle-concert.js";
import { MP_ADJUSTER } from "../../src/cards/piecies/utility/mp-adjuster.js";
import { DOUBLE_TRIGGER } from "../../src/cards/piecies/utility/double-trigger.js";
import { JANTJE_JANTJE } from "../../src/cards/piecies/utility/jantje-jantje.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(overrides: {
  selfMp?: number;
  selfTraits?: Record<string, number>;
  oppMp?: number;
  turnCount?: number;
} = {}): GameState {
  return {
    turnCount: overrides.turnCount ?? 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: cardId("self_main"),
            level: 2,
            mp: overrides.selfMp ?? 60,
            flags: overrides.selfTraits !== undefined ? { traits: overrides.selfTraits } : {}
          }
        ],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({
          slotIndex,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          {
            instanceId: "m2",
            cardId: cardId("opp_main"),
            level: 1,
            mp: overrides.oppMp ?? 80,
            flags: {}
          }
        ],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({
          slotIndex,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 1,
    lastRoll: null
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard(BATTLE_CONCERT);
  registerCard(MP_ADJUSTER);
  registerCard(DOUBLE_TRIGGER);
  registerCard(JANTJE_JANTJE);
});

// ─── battle-concert ───────────────────────────────────────────────────────────

describe("battle-concert", () => {
  it("costs 25 MP and deals 30 MP to opponent", () => {
    const state = createState({ selfMp: 60, oppMp: 80 });
    const next = executeCard(state, cardId("battle-concert"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      targetRef: { playerId: "p2", instanceId: "m2" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(35); // 60 - 25 cost
    expect(next.players[1].mosjes[0].mp).toBe(50); // 80 - 30
  });

  it("grants self +20 MP bonus when acting Mosje has Creative 2+", () => {
    const state = createState({ selfMp: 60, oppMp: 80, selfTraits: { Creative: 2 } });
    const next = executeCard(state, cardId("battle-concert"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      targetRef: { playerId: "p2", instanceId: "m2" }
    });
    // 60 - 25 cost - 30 target loss: self = 60 - 25 = 35, then +20 = 55
    expect(next.players[0].mosjes[0].mp).toBe(55);
    expect(next.players[1].mosjes[0].mp).toBe(50);
  });

  it("does NOT grant bonus when Creative < 2", () => {
    const state = createState({ selfMp: 60, oppMp: 80, selfTraits: { Creative: 1 } });
    const next = executeCard(state, cardId("battle-concert"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      targetRef: { playerId: "p2", instanceId: "m2" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(35);
  });
});

// ─── mp-adjuster ─────────────────────────────────────────────────────────────

describe("mp-adjuster", () => {
  it("subtracts 20 MP when Mosje has >= 50 MP", () => {
    const state = createState({ selfMp: 60 });
    const next = executeCard(state, cardId("mp-adjuster"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(40);
  });

  it("adds 20 MP when Mosje has < 50 MP", () => {
    const state = createState({ selfMp: 30 });
    const next = executeCard(state, cardId("mp-adjuster"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(50);
  });

  it("boundary: exactly 50 MP subtracts 20", () => {
    const state = createState({ selfMp: 50 });
    const next = executeCard(state, cardId("mp-adjuster"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(30);
  });
});

// ─── double-trigger ───────────────────────────────────────────────────────────

describe("double-trigger", () => {
  it("costs 20 MP and applies double_activate_this_turn buff", () => {
    const state = createState({ selfMp: 50, turnCount: 7 });
    const next = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const mosje = next.players[0].mosjes[0];
    expect(mosje.mp).toBe(30); // 50 - 20
    expect(mosje.flags["buff:double_activate_this_turn"]).toBeDefined();
    const buff = mosje.flags["buff:double_activate_this_turn"] as { expiryTurn: number };
    expect(buff.expiryTurn).toBe(7);
  });

  it("buff is scoped to current turn (expiryTurn = turnCount)", () => {
    const state = createState({ selfMp: 50, turnCount: 3 });
    const next = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const buff = next.players[0].mosjes[0].flags["buff:double_activate_this_turn"] as { expiryTurn: number };
    expect(buff.expiryTurn).toBe(3);
  });
});

// ─── jantje-jantje ────────────────────────────────────────────────────────────

describe("jantje-jantje", () => {
  it("costs 15 MP, deals 20 MP to target, and applies mp_gain_reduced buff", () => {
    const state = createState({ selfMp: 50, oppMp: 60, turnCount: 4 });
    const next = executeCard(state, cardId("jantje-jantje"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      targetRef: { playerId: "p2", instanceId: "m2" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(35); // 50 - 15
    expect(next.players[1].mosjes[0].mp).toBe(40); // 60 - 20

    const targetFlags = next.players[1].mosjes[0].flags;
    expect(targetFlags["buff:mp_gain_reduced"]).toBeDefined();
    const buff = targetFlags["buff:mp_gain_reduced"] as { expiryTurn: number; data: { reduceBy: number } };
    expect(buff.data.reduceBy).toBe(10);
    expect(buff.expiryTurn).toBe(5); // turnCount + 1
  });

  it("buff:mp_gain_reduced reduces next gainMP by 10", () => {
    const state = createState({ selfMp: 50, oppMp: 60, turnCount: 4 });
    const afterPlay = executeCard(state, cardId("jantje-jantje"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      targetRef: { playerId: "p2", instanceId: "m2" }
    });

    // Manually apply gainMP to opponent to verify the reduction
    const gainMP = resolvePrimitive("gainMP");
    const afterGain = gainMP(
      afterPlay,
      { target: { playerId: "p2", instanceId: "m2" }, amount: 30 },
      { source: { kind: "card", cardId: cardId("test") }, actingPlayerId: "p2", rng: () => 0.5, turnCount: 4 }
    );
    // 40 + (30 - 10) = 60
    expect(afterGain.players[1].mosjes[0].mp).toBe(60);
  });
});
