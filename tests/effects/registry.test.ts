import { describe, expect, it } from "vitest";
import { primitiveRegistry, resolvePrimitive, UnknownPrimitiveError } from "../../src/effects/registry.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 10, flags: { traits: { Creative: 3 } } },
          { instanceId: "m2", cardId: "partner", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "pet", faceUp: true, turnsSincePlaced: 1 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: ["h1"],
        deck: ["d1", "d2"],
        discard: ["x1"],
        welloePile: ["w1"],
        activeMosjeIndex: 0,
        flags: { "pet:pet:expiryTurn": 10 }
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: ["e1"],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [{ id: "pe1", source: { kind: "ability" }, primitive: "noop", params: {}, canBeCountered: true }],
    eventLog: [],
    rngSeed: 8,
    lastRoll: null
  };
}

function ctx(): EffectContext {
  return {
    source: { kind: "ability", cardId: "registry_test" },
    actingPlayerId: "p1",
    rng: createRng(8),
    turnCount: 1
  };
}

const paramsByPrimitive: Record<string, Record<string, unknown>> = {
  gainMP: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 },
  loseMP: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 },
  drainMP: { from: { playerId: "p1", instanceId: "m1" }, to: { playerId: "p2", instanceId: "m3" }, amount: 1 },
  setMP: { target: { playerId: "p1", instanceId: "m1" }, value: 11 },
  multiplyNextMPGain: { target: { playerId: "p1", instanceId: "m1" }, multiplier: 2, duration: "next_gain" },
  drawCards: { playerId: "p1", count: 1 },
  discardCards: { playerId: "p1", count: 1, mode: "random" },
  revealTopDeck: { playerId: "p1", targetDeckOwner: "p2", count: 1 },
  lookAtTop: { playerId: "p1", targetDeckOwner: "p2", count: 1 },
  searchDeckAndDraw: { playerId: "p1", filter: { byName: "d2" } },
  returnToHand: { playerId: "p1", zone: "discard", cardId: "x1" },
  destroyPlace: {},
  enterPlace: { cardId: "p_new", playerId: "p1" },
  destroyPiecie: { target: { playerId: "p1", slotIndex: 0 } },
  activateFaceDownPiecie: { playerId: "p1", slotIndex: 0 },
  rollDie: { modifier: 1 },
  rerollDie: {},
  chooseDieResult: { chosenValue: 6 },
  applyBuff: { target: { playerId: "p1", instanceId: "m1" }, buffId: "tmp", data: {}, expiryTurn: 3 },
  reduceMPLossBy: { target: { playerId: "p1", instanceId: "m1" }, amount: 5, duration: 1 },
  clearExpiredBuffs: {},
  negateEffect: { pendingEffectId: "pe1" },
  ifThenElse: {
    condition: { condition: "checkTrait", params: { target: { playerId: "p1", instanceId: "m1" }, trait: "Creative", minStars: 3 } },
    then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } },
    else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 2 } }
  },
  chain: { effects: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }] },
  choose: {
    chooserId: "p1",
    options: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }],
    resolver: () => 0
  },
  rollBranch: {
    branches: [
      { range: [1, 6], effect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } } }
    ]
  }
};

describe("primitive registry", () => {
  it("all registered primitives resolve and are callable", () => {
    for (const name of Object.keys(primitiveRegistry)) {
      const primitive = resolvePrimitive(name);
      const next = primitive(createState(), paramsByPrimitive[name], ctx());
      expect(next).toBeDefined();
      expect(typeof next).toBe("object");
    }
  });

  it("resolvePrimitive throws typed error for unknown names", () => {
    expect(() => resolvePrimitive("doesNotExist")).toThrow(UnknownPrimitiveError);
  });

  it("registry is frozen", () => {
    expect(Object.isFrozen(primitiveRegistry)).toBe(true);
  });
});
