import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { MissingTargetError } from "../../src/cards/executor/resolve-target-reference.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardInvocation } from "../../src/cards/executor/execute-card.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

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
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 2, mp: 50, flags: { traits: { Social: 2 } } },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 0, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("mosje_c"), level: 1, mp: 80, flags: { traits: { Social: 3 } } },
          { instanceId: "m4", cardId: cardId("mosje_d"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 7,
    lastRoll: null
  };
}

const p1Invocation: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" },
  targetRef: { playerId: "p2", instanceId: "m3" }
};

describe("card executor (step 3)", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  describe("gainMP card", () => {
    it("executes a free gainMP card and updates state", () => {
      const card: CardDefinition = {
        id: cardId("exec-gain"),
        name: "Exec Gain",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-gain"), p1Invocation);

      expect(next.players[0]?.mosjes[0]?.mp).toBe(70);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("requirement validation", () => {
    it("rejects card when level requirement is not met", () => {
      const card: CardDefinition = {
        id: cardId("exec-needs-level3"),
        name: "Exec Level 3 Required",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "level", params: { minLevel: 3 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
      };
      registerCard(card);

      const state = createState();
      const next = executeCard(state, cardId("exec-needs-level3"), p1Invocation);

      // State should be unchanged (MP not gained)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(50);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });

    it("accepts card when requirement is met", () => {
      const card: CardDefinition = {
        id: cardId("exec-needs-level2"),
        name: "Exec Level 2 Required",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "level", params: { minLevel: 2 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-needs-level2"), p1Invocation);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(70);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("cost payment", () => {
    it("deducts MP cost and runs effects", () => {
      const card: CardDefinition = {
        id: cardId("exec-mp-cost"),
        name: "Exec MP Cost",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "mp", mp: 10 },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-mp-cost"), p1Invocation);
      // MP: 50 - 10 (cost) + 30 (effect) = 70
      expect(next.players[0]?.mosjes[0]?.mp).toBe(70);
    });

    it("rejects when MP is insufficient to pay cost", () => {
      const card: CardDefinition = {
        id: cardId("exec-too-expensive"),
        name: "Exec Too Expensive",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "mp", mp: 100 },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }]
      };
      registerCard(card);

      const state = createState();
      const next = executeCard(state, cardId("exec-too-expensive"), p1Invocation);
      // MP should remain 50 (unchanged)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(50);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });
  });

  describe("synergy bonuses", () => {
    it("applies synergy bonus when partner is on field", () => {
      // p1 has mosje_b with instanceId m2 — m2's cardId is 'mosje_b'
      // Synergy triggers if partnerCardId 'mosje_b' is found in player's mosjes
      const card: CardDefinition = {
        id: cardId("exec-synergy"),
        name: "Exec Synergy",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        synergies: [
          {
            partnerCardId: cardId("mosje_b"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-synergy"), p1Invocation);
      // 50 + 10 (main) + 15 (synergy) = 75
      expect(next.players[0]?.mosjes[0]?.mp).toBe(75);
    });

    it("does not apply synergy when partner is absent", () => {
      const card: CardDefinition = {
        id: cardId("exec-no-synergy"),
        name: "Exec No Synergy",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        synergies: [
          {
            partnerCardId: cardId("mosje_missing"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-no-synergy"), p1Invocation);
      // 50 + 10 = 60 (no synergy bonus)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });
  });

  describe("target resolution", () => {
    it("throws MissingTargetError when opponent target required but not provided", () => {
      const card: CardDefinition = {
        id: cardId("exec-needs-target"),
        name: "Exec Needs Target",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "opponent_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "loseMP", params: { target: "$target", amount: 10 } }]
      };
      registerCard(card);

      const invocationWithoutTarget: CardInvocation = {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
        // targetRef intentionally omitted
      };

      expect(() =>
        executeCard(createState(), cardId("exec-needs-target"), invocationWithoutTarget)
      ).toThrow(MissingTargetError);
    });
  });

  describe("multi-effect chain", () => {
    it("applies all effects in order", () => {
      const card: CardDefinition = {
        id: cardId("exec-multi"),
        name: "Exec Multi",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [
          { primitive: "gainMP", params: { target: "$self", amount: 10 } },
          { primitive: "gainMP", params: { target: "$self", amount: 5 } },
          { primitive: "gainMP", params: { target: "$self", amount: 3 } }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-multi"), p1Invocation);
      // 50 + 10 + 5 + 3 = 68
      expect(next.players[0]?.mosjes[0]?.mp).toBe(68);
    });
  });
});
