import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { resolveTargetReference, MissingTargetError } from "../../src/cards/executor/resolve-target-reference.js";
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
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 1, mp: 50, flags: {} },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 20, flags: {} }
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

const p1Inv: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" }
};

describe("executor branch coverage (step 3 supplement)", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  describe("runEffects error catch branch", () => {
    it("emits effect_execution_failed warning when primitive throws and continues returning state", () => {
      // unknownPrimitive is not in the registry → resolvePrimitive throws UnknownPrimitiveError
      // The runEffects catch block should swallow it and emit a warning
      const card: CardDefinition = {
        id: cardId("exec-throws"),
        name: "Exec Throws",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [
          { primitive: "gainMP", params: { target: "$self", amount: 10 } },
          { primitive: "unknownPrimitiveThatThrows", params: {} }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-throws"), p1Inv);

      // First effect ran (gainMP): 50 + 10 = 60
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);

      // Warning event was emitted for the failure
      const warningEvent = next.eventLog.find(
        (e) => e.type === "warning" && (e as { code: string }).code === "effect_execution_failed"
      );
      expect(warningEvent).toBeDefined();

      // card_resolved still emitted
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("pet synergy branch", () => {
    it("fires pet synergy bonus when pet is face-up in a slot", () => {
      const stateWithPet: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                piecieSlots: p.piecieSlots.map((slot) =>
                  slot.slotIndex !== 0
                    ? slot
                    : { ...slot, cardId: cardId("phantom-pet"), faceUp: true }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-pet-synergy"),
        name: "Exec Pet Synergy",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        petSynergies: [
          {
            petCardId: cardId("phantom-pet"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(stateWithPet, cardId("exec-pet-synergy"), p1Inv);
      // 50 + 10 (main) + 5 (pet synergy) = 65
      expect(next.players[0]?.mosjes[0]?.mp).toBe(65);
    });

    it("does NOT fire pet synergy when pet is face-down", () => {
      // piecieSlot has cardId but faceUp=false
      const stateWithFaceDownPet: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                piecieSlots: p.piecieSlots.map((slot) =>
                  slot.slotIndex !== 0
                    ? slot
                    : { ...slot, cardId: cardId("phantom-pet"), faceUp: false }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-pet-facedown"),
        name: "Exec Pet Face Down",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        petSynergies: [
          {
            petCardId: cardId("phantom-pet"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(stateWithFaceDownPet, cardId("exec-pet-facedown"), p1Inv);
      // 50 + 10 only (no pet synergy)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });
  });

  describe("resolveTargetReference edge cases", () => {
    it("returns self for 'none' target", () => {
      const state = createState();
      const target = resolveTargetReference(state, "none", p1Inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("returns targetRef for 'self_or_ally_mosje' when targetRef provided", () => {
      const inv: CardInvocation = {
        ...p1Inv,
        targetRef: { playerId: "p1", instanceId: "m2" }
      };
      const state = createState();
      const target = resolveTargetReference(state, "self_or_ally_mosje", inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m2" });
    });

    it("falls back to actingMosjeRef for 'self_or_ally_mosje' when targetRef absent", () => {
      const state = createState();
      const target = resolveTargetReference(state, "self_or_ally_mosje", p1Inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("returns undefined for multi-target 'all_opponents'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "all_opponents", p1Inv);
      expect(target).toBeUndefined();
    });

    it("returns undefined for 'all_mosjes'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "all_mosjes", p1Inv);
      expect(target).toBeUndefined();
    });

    it("returns undefined for 'shared_field'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "shared_field", p1Inv);
      expect(target).toBeUndefined();
    });

    it("throws MissingTargetError for 'any_mosje' without targetRef", () => {
      const state = createState();
      expect(() => resolveTargetReference(state, "any_mosje", p1Inv)).toThrow(MissingTargetError);
    });

    it("throws MissingTargetError for 'required_mosje' without targetRef", () => {
      const state = createState();
      expect(() => resolveTargetReference(state, "required_mosje", p1Inv)).toThrow(MissingTargetError);
    });
  });

  describe("requirement type coverage", () => {
    it("evaluates 'trait' requirement correctly when met", () => {
      const stateWithTrait: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                mosjes: p.mosjes.map((m) =>
                  m.instanceId !== "m1" ? m : { ...m, flags: { traits: { Social: 3 } } }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-trait-req"),
        name: "Exec Trait Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "trait", params: { trait: "Social", minStars: 2 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      const next = executeCard(stateWithTrait, cardId("exec-trait-req"), p1Inv);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });

    it("evaluates 'mp' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-mp-req"),
        name: "Exec MP Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "mp", params: { operator: ">=", value: 30 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // p1/m1 has 50 MP >= 30 → passes
      const next = executeCard(createState(), cardId("exec-mp-req"), p1Inv);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });

    it("evaluates 'card_in_play' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-card-type-req"),
        name: "Exec Card Type Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "card_in_play", params: { cardType: "dragon" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // No dragon in play → rejected
      const next = executeCard(createState(), cardId("exec-card-type-req"), p1Inv);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });

    it("evaluates 'place_active' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-place-req"),
        name: "Exec Place Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "place_active", params: { placeCardId: "special_bank" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // No active place → rejected
      const next = executeCard(createState(), cardId("exec-place-req"), p1Inv);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });

    it("evaluates 'custom' requirement as always passing", () => {
      const card: CardDefinition = {
        id: cardId("exec-custom-req"),
        name: "Exec Custom Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "custom", params: { checkName: "mySpecialCheck" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-custom-req"), p1Inv);
      // custom always passes → effect runs
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });
  });
});
