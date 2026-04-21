import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  AFFOE,
  MOMENTUM_DIEFJE,
  SLECHT_GEZET,
  SNOEIERTJE,
  SUPER_SAIYAN_MOS,
  TE_HARD_GAAN
} from "../../src/cards/piecies/attack/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { endTurn } from "../../src/engine/end-turn.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 6,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 40, flags: {} },
          { instanceId: "m2", cardId: cardId("self_partner"), level: 1, mp: 15, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [cardId("d1")],
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
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 30, flags: {} },
          { instanceId: "m4", cardId: cardId("opp_partner"), level: 1, mp: 25, flags: {} }
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
      }
    ],
    activePlace: { cardId: cardId("place_test"), flags: {}, subscribedTriggers: [] },
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 333,
    lastRoll: null
  };
}

function invocationWithTarget() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" },
    targetRef: { playerId: "p2", instanceId: "m3" }
  } as const;
}

function invocationNoTarget() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" }
  } as const;
}

beforeEach(() => {
  clearRegistry();
  registerCard(TE_HARD_GAAN);
  registerCard(SNOEIERTJE);
  registerCard(AFFOE);
  registerCard(SUPER_SAIYAN_MOS);
  registerCard(MOMENTUM_DIEFJE);
  registerCard(SLECHT_GEZET);
});

describe("phase4a step 3 - simple drain piecies", () => {
  it("te-hard-gaan deducts self cost and drains target by 25", () => {
    const next = executeCard(createState(), cardId("te-hard-gaan"), invocationWithTarget());
    expect(next.players[0].mosjes[0].mp).toBe(25);
    expect(next.players[1].mosjes[0].mp).toBe(5);
  });

  it("snoeiertje applies target -15 and end-of-turn self -15 buff", () => {
    const afterPlay = executeCard(createState(), cardId("snoeiertje"), invocationWithTarget());
    expect(afterPlay.players[1].mosjes[0].mp).toBe(15);

    const buff = afterPlay.players[0].mosjes[0].flags["buff:end_of_turn_mp_loss"] as
      | { readonly data?: { readonly amount?: number } }
      | undefined;
    expect(buff?.data?.amount).toBe(15);

    const afterTurn = endTurn(afterPlay);
    expect(afterTurn.players[0].mosjes[0].mp).toBe(25);
    expect(afterTurn.players[0].mosjes[0].flags["buff:end_of_turn_mp_loss"]).toBeUndefined();
  });

  it("affoe applies both target -15 and self +10 with mp cost", () => {
    const next = executeCard(createState(), cardId("affoe"), invocationWithTarget());
    expect(next.players[1].mosjes[0].mp).toBe(15);
    expect(next.players[0].mosjes[0].mp).toBe(45);
  });

  it("super-saiyan-mos applies next quest drain buff with targetRef data", () => {
    const next = executeCard(createState(), cardId("super-saiyan-mos"), invocationWithTarget());
    const buff = next.players[0].mosjes[0].flags["buff:next_quest_drain_target"] as
      | {
          readonly expiryTurn?: number;
          readonly data?: {
            readonly drainAmount?: number;
            readonly targetRef?: { readonly playerId: string; readonly instanceId: string };
          };
        }
      | undefined;

    expect(buff?.data?.drainAmount).toBe(25);
    expect(buff?.data?.targetRef).toEqual({ playerId: "p2", instanceId: "m3" });
    expect(buff?.expiryTurn).toBe(7);
  });

  it("momentum-diefje drains 20 to self and rejects if level requirement not met", () => {
    const next = executeCard(createState(), cardId("momentum-diefje"), invocationWithTarget());
    expect(next.players[1].mosjes[0].mp).toBe(10);
    expect(next.players[0].mosjes[0].mp).toBe(40);

    const lowLevelState: GameState = {
      ...createState(),
      players: createState().players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1" ? mosje : { ...mosje, level: 1 }
              )
            }
      )
    };
    const rejected = executeCard(lowLevelState, cardId("momentum-diefje"), invocationWithTarget());
    expect(rejected.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("slecht-gezet clears active place", () => {
    const next = executeCard(createState(), cardId("slecht-gezet"), invocationNoTarget());
    expect(next.activePlace).toBeNull();
  });
});
