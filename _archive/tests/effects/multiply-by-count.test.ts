import { beforeEach, describe, expect, it } from "vitest";
import { registerCard, clearRegistry } from "../../src/cards/registry/card-registry.js";
import { multiplyByCount } from "../../src/effects/control/multiply-by-count.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

function registerStubCard(id: string, category: CardDefinition["category"]): void {
  registerCard({
    id: cardId(id),
    name: id,
    category,
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "none",
    trigger: "on_play",
    duration: "instant",
    effects: []
  });
}

function createState(handCount: number): GameState {
  const hand = Array.from({ length: handCount }, (_, i) => cardId(`hand_${i}`));
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 1, mp: 10, flags: {} },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand,
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

function ctx(): EffectContext {
  return {
    source: { kind: "card", cardId: cardId("test") },
    actingPlayerId: "p1",
    rng: createRng(1),
    turnCount: 1
  };
}

beforeEach(() => {
  clearRegistry();
  registerStubCard("hand_0", "piecie");
  registerStubCard("hand_1", "piecie");
  registerStubCard("hand_2", "piecie");
  registerStubCard("hand_3", "piecie");
});

describe("multiplyByCount", () => {
  it("no-ops when count is zero", () => {
    const next = multiplyByCount(
      createState(0),
      {
        countParams: { playerId: "p1", zone: "hand", filter: { category: "piecie" } },
        perUnitEffect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 5 } },
        target: "$self"
      },
      ctx()
    );

    expect(next.players[0].mosjes[0].mp).toBe(10);
  });

  it("applies per-unit effect count times with cap", () => {
    const next = multiplyByCount(
      createState(4),
      {
        countParams: { playerId: "p1", zone: "hand", filter: { category: "piecie" } },
        perUnitEffect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 30 } },
        target: "$self",
        cap: 60
      },
      ctx()
    );

    // 2 iterations due to cap 60 at 30 each.
    expect(next.players[0].mosjes[0].mp).toBe(70);
  });
});
