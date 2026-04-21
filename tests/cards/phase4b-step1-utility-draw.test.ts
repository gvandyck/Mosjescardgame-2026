import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  CALL_OF_THE_WELLOES,
  CHAIN_REACTION,
  DINGETJE_TOCH,
  DUBBELE_DING,
  MOSJE_REBORN,
  MP_AMPLIFIER,
  QUEST_PREP,
  REDBULL,
  STRIPJE_BENNIES,
  WELLOE_FORCE
} from "../../src/cards/piecies/utility/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 12,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 80, flags: {} },
          { instanceId: "m2", cardId: cardId("self_partner"), level: 1, mp: 25, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h0")],
        deck: [cardId("d1"), cardId("d2"), cardId("d3"), cardId("d4"), cardId("d5")],
        discard: [cardId("stripje-bennies"), cardId("redbull"), cardId("dubbele-dosis")],
        welloePile: [cardId("welloe_a"), cardId("welloe_b")],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 40, flags: {} },
          { instanceId: "m4", cardId: cardId("opp_partner"), level: 1, mp: 15, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("opp_h1"), cardId("opp_h2")],
        deck: [cardId("od1")],
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
    rngSeed: 123,
    lastRoll: null
  };
}

function invoke(card: string, state: GameState = createState(), choices?: Record<string, unknown>) {
  return executeCard(state, cardId(card), {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" },
    playerChoices: choices
  });
}

beforeEach(() => {
  clearRegistry();
  registerCard(STRIPJE_BENNIES);
  registerCard(REDBULL);
  registerCard(MOSJE_REBORN);
  registerCard(CALL_OF_THE_WELLOES);
  registerCard(WELLOE_FORCE);
  registerCard(DINGETJE_TOCH);
  registerCard(DUBBELE_DING);
  registerCard(QUEST_PREP);
  registerCard(MP_AMPLIFIER);
  registerCard(CHAIN_REACTION);
});

describe("phase4b step 1 - utility and draw piecies", () => {
  it("stripje-bennies loses 20 MP then draws 3", () => {
    const next = invoke("stripje-bennies");
    expect(next.players[0].mosjes[0].mp).toBe(60);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1"), cardId("d2"), cardId("d3")]);
  });

  it("redbull draws 2 and grants this-turn extra slot buff", () => {
    const next = invoke("redbull");
    expect(next.players[0].mosjes[0].mp).toBe(70);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1"), cardId("d2")]);
    expect(next.players[0].mosjes[0].flags["buff:extra_piecie_slot_this_turn"]).toMatchObject({
      data: { extraSlots: 1 },
      expiryTurn: 12
    });
  });

  it("mosje-reborn returns chosen welloe mosje to hand", () => {
    const next = invoke("mosje-reborn", createState(), { mosjeId: cardId("welloe_a") });
    expect(next.players[0].welloePile).toEqual([cardId("welloe_b")]);
    expect(next.players[0].hand).toContain(cardId("welloe_a"));
  });

  it("call-of-the-welloes uses return-to-hand stub with player choice", () => {
    const next = invoke("call-of-the-welloes", createState(), { mosjeId: cardId("welloe_b") });
    expect(next.players[0].welloePile).toEqual([cardId("welloe_a")]);
    expect(next.players[0].hand).toContain(cardId("welloe_b"));
  });

  it("call-of-the-welloes emits warning when choice is missing", () => {
    expect(() => invoke("call-of-the-welloes")).toThrow("Unknown '$'-placeholder: $choice:mosjeId");
  });

  it("welloe-force deals 10 MP to each opponent active mosje then draws 1", () => {
    const next = invoke("welloe-force");
    expect(next.players[0].mosjes[0].mp).toBe(70);
    expect(next.players[1].mosjes[0].mp).toBe(30);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1")]);
  });

  it("dingetje-toch gains 30 when active MP is at least 120", () => {
    const boostedState = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m1") return mosje;
            return { ...mosje, mp: 120 };
          })
        };
      })
    };

    const next = invoke("dingetje-toch", boostedState);
    expect(next.players[0].mosjes[0].mp).toBe(0);
    expect(next.players[0].mosjes[0].level).toBe(3);
    expect(next.players[0].hand).toEqual([cardId("h0")]);
  });

  it("dingetje-toch draws 1 when active MP is below threshold", () => {
    const next = invoke("dingetje-toch");
    expect(next.players[0].mosjes[0].mp).toBe(80);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1")]);
  });

  it("dubbele-ding doubles next gain once via buff and consumes it", () => {
    const boostedState = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m1") return mosje;
            return { ...mosje, mp: 120 };
          })
        };
      })
    };
    const withBuff = invoke("dubbele-ding", boostedState);
    expect(withBuff.players[0].mosjes[0].flags["buff:double_next_mp_gain"]).toBeDefined();

    const afterGain = executeCard(withBuff, cardId("dingetje-toch"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(afterGain.players[0].mosjes[0].mp).toBe(0);
    expect(afterGain.players[0].mosjes[0].level).toBe(3);
    expect(afterGain.players[0].mosjes[0].flags["buff:double_next_mp_gain"]).toBeUndefined();
  });

  it("dubbele-dosis applies quest auto-complete buff until end of turn", () => {
    const next = invoke("dubbele-dosis");
    expect(next.players[0].mosjes[0].flags["buff:quest_auto_complete_once"]).toMatchObject({
      data: { consumesOnQuest: true },
      expiryTurn: 12
    });
  });

  it("mp-amplifier doubles gainMP effects for the current turn", () => {
    const amplified = invoke("mp-amplifier");
    const gained = executeCard(amplified, cardId("chain-reaction"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(amplified.players[0].mosjes[0].mp).toBe(80);
    expect(gained.players[0].mosjes[0].level).toBe(3);
    expect(gained.players[0].mosjes[0].mp).toBe(40);
  });

  it("chain-reaction gains 10 per discarded piecie card up to cap 5", () => {
    const withManyDiscard = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          discard: [
            cardId("stripje-bennies"),
            cardId("redbull"),
            cardId("dubbele-dosis"),
            cardId("chain-reaction"),
            cardId("dingetje-toch"),
            cardId("mp-amplifier")
          ]
        };
      })
    };

    const next = invoke("chain-reaction", withManyDiscard);
    expect(next.players[0].mosjes[0].mp).toBe(30);
    expect(next.players[0].mosjes[0].level).toBe(3);
  });

  it("chain-reaction does nothing when discard has no registered piecie cards", () => {
    const withUnknownDiscard = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return { ...player, discard: [cardId("unknown_a"), cardId("unknown_b")] };
      })
    };

    const next = invoke("chain-reaction", withUnknownDiscard);
    expect(next.players[0].mosjes[0].mp).toBe(80);
  });
});
