import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  AFBLIJVEN,
  CONTROLLER,
  GRAMMETJE_PIETER,
  KEYBOARD,
  LAAT_ME_CHILLEN,
  LARRY_ZEGELTJE,
  MOSJE_SHIELD,
  MOUSE,
  STOOKERINO,
  STRAFFOE,
  TEMPIECIE,
  TIKKER
} from "../../src/cards/piecies/conditional/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 15,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 70, flags: { traits: { Technical: 2 } } },
          { instanceId: "m2", cardId: cardId("mouse"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h0")],
        deck: [cardId("d1"), cardId("keyboard"), cardId("controller")],
        discard: [cardId("discard_x")],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 50, flags: {} },
          { instanceId: "m4", cardId: cardId("opp_partner"), level: 1, mp: 15, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
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
    activePlace: { cardId: cardId("place_test"), flags: {}, subscribedTriggers: [] },
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 111,
    lastRoll: null
  };
}

function invoke(card: string, state: GameState = createState(), choices?: Record<string, unknown>) {
  return executeCard(state, cardId(card), {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" },
    targetRef: { playerId: "p2", instanceId: "m3" },
    playerChoices: choices
  });
}

beforeEach(() => {
  clearRegistry();
  registerCard(KEYBOARD);
  registerCard(MOUSE);
  registerCard(CONTROLLER);
  registerCard(GRAMMETJE_PIETER);
  registerCard(LARRY_ZEGELTJE);
  registerCard(STRAFFOE);
  registerCard(TIKKER);
  registerCard(TEMPIECIE);
  registerCard(AFBLIJVEN);
  registerCard(LAAT_ME_CHILLEN);
  registerCard(STOOKERINO);
  registerCard(MOSJE_SHIELD);
});

describe("phase4b step 2 - conditional piecies", () => {
  it("keyboard grants draw and mouse synergy bonus", () => {
    const next = invoke("keyboard");
    expect(next.players[0].mosjes[0].mp).toBe(90);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1")]);
  });

  it("mouse searches deck when keyboard is in play", () => {
    const withKeyboardInPlay = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) =>
            mosje.instanceId === "m2" ? { ...mosje, cardId: cardId("keyboard") } : mosje
          )
        };
      })
    };

    const next = invoke("mouse", withKeyboardInPlay);
    expect(next.players[0].mosjes[0].mp).toBe(80);
    expect(next.players[0].hand.length).toBe(2);
  });

  it("controller applies technical branch bonus", () => {
    const next = invoke("controller");
    expect(next.players[0].mosjes[0].mp).toBe(95);
  });

  it("controller no bonus when technical trait is too low", () => {
    const lowTech = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) =>
            mosje.instanceId === "m1" ? { ...mosje, flags: { traits: { Technical: 1 } } } : mosje
          )
        };
      })
    };

    const next = invoke("controller", lowTech);
    expect(next.players[0].mosjes[0].mp).toBe(80);
  });

  it("grammetje-pieter resolves +30 then -15", () => {
    const next = invoke("grammetje-pieter");
    expect(next.players[0].mosjes[0].mp).toBe(-15);
  });

  it("larry-zegeltje resolves +20 then -25", () => {
    const next = invoke("larry-zegeltje");
    expect(next.players[0].mosjes[0].mp).toBe(65);
  });

  it("straffoe applies resilient bonus branch", () => {
    const resilient = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) =>
            mosje.instanceId === "m1" ? { ...mosje, flags: { traits: { Resilient: 2 } } } : mosje
          )
        };
      })
    };
    const next = invoke("straffoe", resilient);
    expect(next.players[0].mosjes[0].mp).toBe(90);
  });

  it("straffoe fallback branch nets zero", () => {
    const next = invoke("straffoe");
    expect(next.players[0].mosjes[0].mp).toBe(70);
  });

  it("tikker applies quest lock buff for next turn", () => {
    const next = invoke("tikker");
    expect(next.players[0].mosjes[0].flags["buff:quest_locked"]).toMatchObject({ expiryTurn: 16 });
  });

  it("tempiecie retrieves from discard and marks card lock buff", () => {
    const withCard = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, discard: [cardId("keyboard")] }
      )
    };

    const next = invoke("tempiecie", withCard, { cardId: cardId("keyboard") });
    expect(next.players[0].hand).toContain(cardId("keyboard"));
    expect(next.players[0].mosjes[0].flags["buff:retrieved_card_locked"]).toBeDefined();
  });

  it("afblijven locks opponent piecie activation", () => {
    const next = invoke("afblijven");
    expect(next.players[1].mosjes[0].flags["buff:piecie_activation_locked"]).toMatchObject({ expiryTurn: 16 });
  });

  it("laat-me-chillen gives +20 and untargetable buff", () => {
    const next = invoke("laat-me-chillen");
    expect(next.players[0].mosjes[0].mp).toBe(80);
    expect(next.players[0].mosjes[0].flags["buff:untargetable"]).toMatchObject({ expiryTurn: 15 });
  });

  it("stookerino applies lock and MP loss to opponent", () => {
    const next = invoke("stookerino");
    expect(next.players[1].mosjes[0].mp).toBe(40);
    expect(next.players[1].mosjes[0].flags["buff:ability_locked"]).toMatchObject({ expiryTurn: 16 });
  });

  it("mosje-shield applies two-turn welloe protection buff", () => {
    const next = invoke("mosje-shield");
    expect(next.players[0].mosjes[0].flags["buff:welloe_protection"]).toMatchObject({ expiryTurn: 17 });
  });
});
