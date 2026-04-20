import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  BAGGA_OF_GREED,
  BONG_HIT_DEMOLITION,
  TWEEDE_KANS,
  ZIE_JE_DIE_DINGETJES
} from "../../src/cards/piecies/utility/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 8,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 35, flags: {} },
          { instanceId: "m2", cardId: cardId("self_partner"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h0")],
        deck: [cardId("d1"), cardId("d2"), cardId("d3"), cardId("d4")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 30, flags: {} },
          { instanceId: "m4", cardId: cardId("opp_partner"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [cardId("e1")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      }
    ],
    activePlace: { cardId: cardId("place_test"), flags: {} },
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 444,
    lastRoll: { raw: 2, modifier: 1, final: 3, rollerId: "p1" }
  };
}

function invocationNoTarget() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" }
  } as const;
}

beforeEach(() => {
  clearRegistry();
  registerCard(BAGGA_OF_GREED);
  registerCard(ZIE_JE_DIE_DINGETJES);
  registerCard(BONG_HIT_DEMOLITION);
  registerCard(TWEEDE_KANS);
});

describe("phase4a step 4 - draw/deck utility piecies", () => {
  it("bagga-of-greed draws 2 then discards 1 in choose mode", () => {
    const next = executeCard(createState(), cardId("bagga-of-greed"), {
      ...invocationNoTarget(),
      playerChoices: { baggaDiscard: [cardId("d1")] }
    });

    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d2")]);
    expect(next.players[0].discard).toEqual([cardId("d1")]);
  });

  it("zie-je-die-dingetjes reveals top 3 and draws top 1", () => {
    const next = executeCard(createState(), cardId("zie-je-die-dingetjes"), invocationNoTarget());

    const revealEvent = next.eventLog.find((event) => event.type === "cards_revealed_private") as
      | { type: "cards_revealed_private"; cards: ReadonlyArray<CardId> }
      | undefined;
    expect(revealEvent?.cards).toEqual([cardId("d1"), cardId("d2"), cardId("d3")]);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1")]);
  });

  it("bong-hit-demolition destroys place and draws 2 with MP cost", () => {
    const next = executeCard(createState(), cardId("bong-hit-demolition"), invocationNoTarget());
    expect(next.players[0].mosjes[0].mp).toBe(25);
    expect(next.activePlace).toBeNull();
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1"), cardId("d2")]);
  });

  it("tweede-kans rerolls existing die result", () => {
    const next = executeCard(createState(), cardId("tweede-kans"), invocationNoTarget());

    expect(next.players[0].mosjes[0].mp).toBe(30);
    expect(next.lastRoll).not.toBeNull();
    expect(next.eventLog.some((event) => event.type === "die_rerolled")).toBe(true);
  });
});
