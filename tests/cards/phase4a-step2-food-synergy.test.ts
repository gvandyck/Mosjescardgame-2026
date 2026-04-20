import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  CHEFS_SPECIAL,
  DIKKE_JONKO,
  RONALD_KIP,
  VARKENSPOOTJES
} from "../../src/cards/piecies/momentum-gaining/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createStateThreePlayers(): GameState {
  return {
    turnCount: 4,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 40, flags: {} },
          { instanceId: "m2", cardId: cardId("self_partner"), level: 1, mp: 20, flags: {} }
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
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("opp2_main"), level: 1, mp: 30, flags: {} },
          { instanceId: "m4", cardId: cardId("opp2_partner"), level: 1, mp: 25, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h2a"), cardId("h2b")],
        deck: [cardId("e1"), cardId("e2")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      },
      {
        id: "p3",
        name: "P3",
        mosjes: [
          { instanceId: "m5", cardId: cardId("opp3_main"), level: 1, mp: 35, flags: {} },
          { instanceId: "m6", cardId: cardId("opp3_partner"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h3a")],
        deck: [cardId("f1"), cardId("f2")],
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
    rngSeed: 123,
    lastRoll: null
  };
}

function invocation() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" }
  } as const;
}

beforeEach(() => {
  clearRegistry();
  registerCard(RONALD_KIP);
  registerCard(VARKENSPOOTJES);
  registerCard(CHEFS_SPECIAL);
  registerCard(DIKKE_JONKO);
});

describe("phase4a step 2 - food synergy piecies", () => {
  it("ronald-kip gives base 50, and 60 with Ronald partner synergy", () => {
    const noSynergy = executeCard(createStateThreePlayers(), cardId("ronald-kip"), invocation());
    expect(noSynergy.players[0].mosjes[0].mp).toBe(90);

    const withPartner: GameState = {
      ...createStateThreePlayers(),
      players: createStateThreePlayers().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m2"
                  ? mosje
                  : { ...mosje, cardId: cardId("ronald-the-master-chef") }
              )
            }
      )
    };

    const withSynergy = executeCard(withPartner, cardId("ronald-kip"), invocation());
    expect(withSynergy.players[0].mosjes[0].mp).toBe(0);
    expect(withSynergy.players[0].mosjes[0].level).toBe(3);
  });

  it("varkenspootjes gains 60 with Binti in play, otherwise loses 30", () => {
    const withBinti: GameState = {
      ...createStateThreePlayers(),
      players: createStateThreePlayers().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m2"
                  ? mosje
                  : { ...mosje, flags: { ...mosje.flags, cardType: "binti" } }
              )
            }
      )
    };

    const boosted = executeCard(withBinti, cardId("varkenspootjes"), invocation());
    expect(boosted.players[0].mosjes[0].mp).toBe(0);
    expect(boosted.players[0].mosjes[0].level).toBe(3);

    const penalized = executeCard(createStateThreePlayers(), cardId("varkenspootjes"), invocation());
    expect(penalized.players[0].mosjes[0].mp).toBe(10);
  });

  it("chefs-special gives +15 without Ronald and reveal +30 with Ronald", () => {
    const noRonald = executeCard(createStateThreePlayers(), cardId("chefs-special"), invocation());
    // 40 - 10 cost + 15 effect = 45
    expect(noRonald.players[0].mosjes[0].mp).toBe(45);

    const withRonald: GameState = {
      ...createStateThreePlayers(),
      players: createStateThreePlayers().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m2"
                  ? mosje
                  : { ...mosje, flags: { ...mosje.flags, cardType: "ronald" } }
              )
            }
      )
    };

    const boosted = executeCard(withRonald, cardId("chefs-special"), invocation());
    // 40 - 10 cost + 30 effect = 60
    expect(boosted.players[0].mosjes[0].mp).toBe(60);

    const revealEvents = boosted.eventLog.filter((event) => event.type === "cards_revealed_private");
    expect(revealEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("dikke-jonko: self +25, each opponent +10, all players draw 1 in 3-player setup", () => {
    const next = executeCard(createStateThreePlayers(), cardId("dikke-jonko"), invocation());

    expect(next.players[0].mosjes[0].mp).toBe(65);
    expect(next.players[1].mosjes[0].mp).toBe(40);
    expect(next.players[2].mosjes[0].mp).toBe(45);

    expect(next.players[0].hand).toEqual([cardId("d1")]);
    expect(next.players[1].hand).toEqual([cardId("h2a"), cardId("h2b"), cardId("e1")]);
    expect(next.players[2].hand).toEqual([cardId("h3a"), cardId("f1")]);
  });
});
