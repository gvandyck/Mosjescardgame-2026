import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { PROOF_CONDITIONAL_DRAIN } from "../../src/cards/proof/proof-conditional-drain.js";
import { PROOF_SIMPLE_GAIN } from "../../src/cards/proof/proof-simple-gain.js";
import { PROOF_SYNERGY_BUFF } from "../../src/cards/proof/proof-synergy-buff.js";
import type { CardInvocation } from "../../src/cards/executor/execute-card.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

/** Base state: p1 has 50 MP on m1, p2 has 80 MP on m3 (Social 3). */
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
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          // p2's active mosje HAS Social 3 by default
          {
            instanceId: "m3",
            cardId: cardId("mosje_c"),
            level: 1,
            mp: 80,
            flags: { traits: { Social: 3 } }
          },
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
        totalDamageTaken: 0,
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

const p1Self: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" }
};

const p1ToP2: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" },
  targetRef: { playerId: "p2", instanceId: "m3" }
};

describe("proof cards (step 4)", () => {
  beforeEach(() => {
    clearRegistry();
    registerCard(PROOF_SIMPLE_GAIN);
    registerCard(PROOF_CONDITIONAL_DRAIN);
    registerCard(PROOF_SYNERGY_BUFF);
  });
  afterEach(() => clearRegistry());

  describe("proof-simple-gain", () => {
    it("gains 25 MP with no cost or requirements", () => {
      const next = executeCard(createState(), cardId("proof-simple-gain"), p1Self);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(75); // 50 + 25
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("proof-conditional-drain", () => {
    it("takes the 'then' branch when target has Social 2+", () => {
      // p2/m3 has Social 3 — condition met → drain 20
      const next = executeCard(createState(), cardId("proof-conditional-drain"), p1ToP2);
      // p1 pays 10 MP cost: 50 - 10 = 40, then gains 20 from drain: 40 + 20 = 60
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
      // p2 loses 20 from drain
      expect(next.players[1]?.mosjes[0]?.mp).toBe(60); // 80 - 20
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });

    it("takes the 'else' branch when target lacks Social 2+", () => {
      // Override p2/m3 to have no traits (Social 0 → condition false → drain 10)
      const state: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p2"
            ? p
            : {
                ...p,
                mosjes: p.mosjes.map((m) =>
                  m.instanceId !== "m3" ? m : { ...m, flags: {} }
                )
              }
        )
      };

      const next = executeCard(state, cardId("proof-conditional-drain"), p1ToP2);
      // p1: 50 - 10 (cost) + 10 (drain gain) = 50
      expect(next.players[0]?.mosjes[0]?.mp).toBe(50);
      // p2: 80 - 10 = 70
      expect(next.players[1]?.mosjes[0]?.mp).toBe(70);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("proof-synergy-buff", () => {
    it("applies buff only when partner is NOT on field", () => {
      // p1 has mosje_a and mosje_b — neither has cardId 'proof-simple-gain'
      // So synergy does NOT fire
      const next = executeCard(createState(), cardId("proof-synergy-buff"), p1Self);

      // p1 pays 15 MP cost: 50 - 15 = 35 (no extra gainMP since no synergy)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(35);

      // Check buff was applied on m1
      const m1 = next.players[0]?.mosjes[0];
      expect(m1?.flags["buff:mp-loss-reduction"]).toBeDefined();

      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });

    it("applies buff + synergy bonus when partner IS on field", () => {
      // Give p1 a mosje whose cardId is 'proof-simple-gain' to trigger synergy
      const stateWithPartner: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                mosjes: p.mosjes.map((m) =>
                  m.instanceId !== "m2"
                    ? m
                    : { ...m, cardId: cardId("proof-simple-gain") }
                )
              }
        )
      };

      const next = executeCard(stateWithPartner, cardId("proof-synergy-buff"), p1Self);

      // p1: 50 - 15 (cost) + 15 (synergy bonus gainMP) = 50
      expect(next.players[0]?.mosjes[0]?.mp).toBe(50);

      // Buff still applied
      const m1 = next.players[0]?.mosjes[0];
      expect(m1?.flags["buff:mp-loss-reduction"]).toBeDefined();

      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("cost-on-failure behavior", () => {
    it("cost payment commits before effects run (no automatic refund)", () => {
      // This test documents the chosen behavior: if an effect fails mid-chain
      // after cost is already paid, the cost is NOT refunded. The executor
      // reports via card_resolved outcome='partial' or emits a warning event.
      // We verify this by observing that a card with a valid cost but
      // an effect that emits a warning (not throw) still deducts the cost.
      const card = {
        id: cardId("proof-cost-then-warn"),
        name: "Proof Cost Then Warn",
        category: "piecie" as const,
        isBoosterOnly: false,
        cost: { type: "mp" as const, mp: 10 },
        requirements: [],
        target: "self_active_mosje" as const,
        trigger: "on_play" as const,
        duration: "instant" as const,
        effects: [
          // gainMP with amount 0 → emits warning, no state change
          { primitive: "gainMP", params: { target: "$self", amount: 0 } }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("proof-cost-then-warn"), p1Self);
      // Cost was paid: 50 - 10 = 40
      expect(next.players[0]?.mosjes[0]?.mp).toBe(40);
      // card_resolved still succeeds (warnings don't fail the card)
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });
});
