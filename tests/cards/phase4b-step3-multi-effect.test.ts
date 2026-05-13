import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { endTurn } from "../../src/engine/end-turn.js";
import {
  CONTINUOUS_ASSAULT,
  DIKKE_TAKS,
  HARDE_DIDDE,
  KLAAR_MET_JOU,
  KLEINE_TAKS,
  MP_HEMORRHAGE
} from "../../src/cards/piecies/attack/index.js";
import {
  EMERGENCY_SWAP,
  F1_TELEMETRY_DATA,
  HUISBAAS,
  PERFECT_SETUP,
  SHHH_POPO_KOMT,
  SYNERGY_FIELD,
  THOSE_EYELASHES_THO,
  KEYBOARD
} from "../../src/cards/piecies/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 20,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 80, flags: { traits: { Technical: 2 } } },
          { instanceId: "m2", cardId: cardId("ally"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [cardId("h0")],
        deck: [cardId("d1"), cardId("d2")],
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
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 35, flags: {} },
          { instanceId: "m4", cardId: cardId("opp_partner"), level: 1, mp: 15, flags: {} }
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
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p3",
        name: "P3",
        mosjes: [
          { instanceId: "m5", cardId: cardId("opp2_main"), level: 1, mp: 50, flags: {} },
          { instanceId: "m6", cardId: cardId("opp2_partner"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [cardId("f1")],
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
    rngSeed: 222,
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
  registerCard(KLEINE_TAKS);
  registerCard(DIKKE_TAKS);
  registerCard(HARDE_DIDDE);
  registerCard(KLAAR_MET_JOU);
  registerCard(MP_HEMORRHAGE);
  registerCard(CONTINUOUS_ASSAULT);
  registerCard(THOSE_EYELASHES_THO);
  registerCard(F1_TELEMETRY_DATA);
  registerCard(PERFECT_SETUP);
  registerCard(HUISBAAS);
  registerCard(SHHH_POPO_KOMT);
  registerCard(SYNERGY_FIELD);
  registerCard(EMERGENCY_SWAP);
  registerCard(KEYBOARD);
});

describe("phase4b step 3 - multi-effect piecies", () => {
  it("kleine-taks applies immediate loss and end-turn ticks until defeat", () => {
    const played = invoke("kleine-taks");
    expect(played.players[1].mosjes[0].mp).toBe(20);

    const tick1 = endTurn({ ...played, currentPlayerId: "p2" });
    expect(tick1.players[1].mosjes[0].mp).toBe(10);

    const tick2 = endTurn({ ...tick1, currentPlayerId: "p2" });
    expect(tick2.players[1].mosjes[0].flags.in_welloe).toBe(true); // defeated at 0 MP

    const tick3 = endTurn({ ...tick2, currentPlayerId: "p2" });
    expect(tick3.players[1].mosjes[0].mp).toBe(0); // no further change after defeat
  });

  it("dikke-taks hits all opponents and draws 2", () => {
    const next = invoke("dikke-taks");
    expect(next.players[1].mosjes[0].mp).toBe(0);
    expect(next.players[2].mosjes[0].mp).toBe(15);
    expect(next.players[0].hand).toEqual([cardId("h0"), cardId("d1"), cardId("d2")]);
  });

  it("harde-didde accepts <= 50 and sends target to welloe", () => {
    const next = invoke("harde-didde");
    expect(next.players[1].mosjes[0].flags.in_welloe).toBe(true);
  });

  it("harde-didde rejects when target MP is above threshold", () => {
    const highTarget = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p2") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) =>
            mosje.instanceId === "m3" ? { ...mosje, mp: 51 } : mosje
          )
        };
      })
    };
    const next = invoke("harde-didde", highTarget);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("klaar-met-jou enforces <= 40 threshold", () => {
    const lowTarget = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p2") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) =>
            mosje.instanceId === "m3" ? { ...mosje, mp: 40 } : mosje
          )
        };
      })
    };
    const next = invoke("klaar-met-jou", lowTarget);
    expect(next.players[1].mosjes[0].flags.in_welloe).toBe(true);
  });

  it("mp-hemorrhage applies immediate and next-turn loss buff", () => {
    const played = invoke("mp-hemorrhage");
    expect(played.players[1].mosjes[0].mp).toBe(15);
    const tick = endTurn({ ...played, currentPlayerId: "p2" });
    expect(tick.players[1].mosjes[0].mp).toBe(0);
  });

  it("continuous-assault applies immediate and ticks until Mosje is defeated", () => {
    const played = invoke("continuous-assault");
    expect(played.players[1].mosjes[0].mp).toBe(20);

    const tick1 = endTurn({ ...played, currentPlayerId: "p2" });
    expect(tick1.players[1].mosjes[0].mp).toBe(5);

    const tick2 = endTurn({ ...tick1, currentPlayerId: "p2" });
    expect(tick2.players[1].mosjes[0].flags.in_welloe).toBe(true); // defeated at -10

    const tick3 = endTurn({ ...tick2, currentPlayerId: "p2" });
    expect(tick3.players[1].mosjes[0].mp).toBe(-10); // no further change after defeat
  });

  it("those-eyelashes-tho gains self MP and locks all opponents", () => {
    const next = invoke("those-eyelashes-tho");
    expect(next.players[0].mosjes[0].mp).toBe(85);
    expect(next.players[1].mosjes[0].flags["buff:ability_locked"]).toBeDefined();
    expect(next.players[2].mosjes[0].flags["buff:ability_locked"]).toBeDefined();
  });

  it("f1-telemetry-data applies technical branch and look-at-top", () => {
    const next = invoke("f1-telemetry-data");
    expect(next.players[0].mosjes[0].mp).toBe(0);
    expect(next.eventLog.some((event) => event.type === "cards_revealed_private")).toBe(true);
  });

  it("perfect-setup accepts 60-90 and writes quest override only", () => {
    const next = invoke("perfect-setup", createState(), { targetMP: 75 });
    expect(next.players[0].mosjes[0].flags.quest_mp_override).toBe(75);
    expect(next.players[0].mosjes[0].mp).toBe(80);
  });

  it("perfect-setup rejects out-of-range choices", () => {
    const low = invoke("perfect-setup", createState(), { targetMP: 59 });
    const high = invoke("perfect-setup", createState(), { targetMP: 91 });
    expect(low.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    expect(high.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("huisbaas and shhh-popo-komt both destroy place and grant MP", () => {
    const huis = invoke("huisbaas");
    const popo = invoke("shhh-popo-komt");
    expect(huis.activePlace).toBeNull();
    expect(popo.activePlace).toBeNull();
  });

  it("synergy-field forces synergy checks for follow-up cards", () => {
    const forced = invoke("synergy-field");
    const next = executeCard(forced, cardId("keyboard"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(next.players[0].mosjes[0].flags["buff:synergy_active_forced"]).toBeDefined();
    expect(next.players[0].mosjes[0].mp).toBe(95);
  });

  it("emergency-swap switches active mosje and applies copy buff", () => {
    const next = invoke("emergency-swap", createState(), { targetMosjeCardId: cardId("opp_main") });
    expect(next.players[0].activeMosjeIndex).toBe(1);
    expect(next.players[0].mosjes[0].flags["buff:copy_ability_once"]).toBeDefined();
  });
});
