import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  BROODJE_DONER,
  ENERGY_SURGE,
  GUN_EEN_PIECE,
  KANNETJE_MELK,
  MOMENTUM_BOOST,
  MOMENTUM_RUSH,
  NATURE_S_GIFT,
  WARM_KANNETJE_MELK
} from "../../src/cards/piecies/momentum-gaining/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 3,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 1, mp: 20, flags: {} },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [cardId("d1"), cardId("d2"), cardId("d3")],
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
          { instanceId: "m3", cardId: cardId("mosje_c"), level: 1, mp: 30, flags: {} },
          { instanceId: "m4", cardId: cardId("mosje_d"), level: 1, mp: 30, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [cardId("e1"), cardId("e2")],
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
    rngSeed: 99,
    lastRoll: null
  };
}

function invocation() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" }
  } as const;
}

function withSelfMP(state: GameState, mp: number): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id !== "p1"
        ? player
        : {
            ...player,
            mosjes: player.mosjes.map((mosje) =>
              mosje.instanceId !== "m1" ? mosje : { ...mosje, mp }
            )
          }
    )
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard(KANNETJE_MELK);
  registerCard(BROODJE_DONER);
  registerCard(ENERGY_SURGE);
  registerCard(NATURE_S_GIFT);
  registerCard(MOMENTUM_BOOST);
  registerCard(WARM_KANNETJE_MELK);
  registerCard(MOMENTUM_RUSH);
  registerCard(GUN_EEN_PIECE);
});

describe("phase4a step 1 - simple gain piecies", () => {
  it("kannetje-melk gives +25 MP to self active mosje", () => {
    const next = executeCard(createState(), cardId("kannetje-melk"), invocation());
    expect(next.players[0].mosjes[0].mp).toBe(45);
  });

  it("broodje-doner rejects invalid low level and applies +35 at level >= 1", () => {
    const invalidLevelState: GameState = {
      ...createState(),
      players: createState().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1"
                  ? mosje
                  : { ...mosje, level: 0 as unknown as 1 | 2 | 3 }
              )
            }
      )
    };

    const rejected = executeCard(invalidLevelState, cardId("broodje-doner"), invocation());
    expect(rejected.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });

    const accepted = executeCard(createState(), cardId("broodje-doner"), invocation());
    expect(accepted.players[0].mosjes[0].mp).toBe(55);
  });

  it("shoettoe applies at MP <= 29 and rejects at MP >= 30", () => {
    const accepted = executeCard(withSelfMP(createState(), 29), cardId("shoettoe"), invocation());
    expect(accepted.players[0].mosjes[0].mp).toBe(49);

    const rejected = executeCard(withSelfMP(createState(), 30), cardId("shoettoe"), invocation());
    expect(rejected.players[0].mosjes[0].mp).toBe(30);
    expect(rejected.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("nature-s-gift runs both resilient branches", () => {
    const resilientState: GameState = {
      ...createState(),
      players: createState().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1"
                  ? mosje
                  : { ...mosje, flags: { ...mosje.flags, traits: { Resilient: 2 } } }
              )
            }
      )
    };

    const thenState = executeCard(resilientState, cardId("nature-s-gift"), invocation());
    expect(thenState.players[0].mosjes[0].mp).toBe(60);

    const elseState = executeCard(createState(), cardId("nature-s-gift"), invocation());
    expect(elseState.players[0].mosjes[0].mp).toBe(50);
  });

  it("momentum-boost grants +15 and applies buff with currentTurn+1 expiry", () => {
    const next = executeCard(createState(), cardId("momentum-boost"), invocation());
    expect(next.players[0].mosjes[0].mp).toBe(35);

    const buff = next.players[0].mosjes[0].flags["buff:next_quest_mp_bonus"] as
      | { readonly expiryTurn?: number; readonly data?: { readonly bonusMP?: number } }
      | undefined;
    expect(buff?.data?.bonusMP).toBe(10);
    expect(buff?.expiryTurn).toBe(4);
  });

  it("warm-kannetje-melk loses 10 MP before drawing 2", () => {
    const next = executeCard(createState(), cardId("warm-kannetje-melk"), invocation());
    expect(next.players[0].mosjes[0].mp).toBe(10);
    expect(next.players[0].hand).toEqual([cardId("d1"), cardId("d2")]);

    const loseEventIndex = next.eventLog.findIndex((event) => event.type === "mp_lost");
    const firstDrawEventIndex = next.eventLog.findIndex((event) => event.type === "card_drawn");
    expect(loseEventIndex).toBeGreaterThanOrEqual(0);
    expect(firstDrawEventIndex).toBeGreaterThan(loseEventIndex);
  });

  it("gun-een-piece draws 2 cards without changing MP", () => {
    const next = executeCard(createState(), cardId("gun-een-piece"), invocation());
    expect(next.players[0].mosjes[0].mp).toBe(20);
    expect(next.players[0].hand).toEqual([cardId("d1"), cardId("d2")]);
  });

  it("momentum-rush (snelle-piecie) gives +15 and draws 1", () => {
    const next = executeCard(createState(), cardId("momentum-rush"), invocation());
    expect(next.players[0].mosjes[0].mp).toBe(35);
    expect(next.players[0].hand).toEqual([cardId("d1")]);
  });
});
