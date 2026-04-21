import { beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility, executeTriggeredMosjeAbility } from "../../src/cards/executor/index.js";
import {
  BINTI_THE_CREATOR,
  BINTI_THE_SHARP_TONGUE,
  CLESS_THE_TEACHER,
  COERT_KASTELUCK,
  DJ_8020
} from "../../src/cards/mosjes/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function createState(overrides?: {
  selfCardId?: CardId;
  selfMp?: number;
  opponentMp?: number;
  selfFlags?: Readonly<Record<string, unknown>>;
  hand?: ReadonlyArray<CardId>;
  opponentHand?: ReadonlyArray<CardId>;
  discard?: ReadonlyArray<CardId>;
}): GameState {
  return {
    turnCount: 2,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: overrides?.selfCardId ?? DJ_8020.id,
            level: 1,
            mp: overrides?.selfMp ?? 20,
            flags: overrides?.selfFlags ?? {}
          },
          {
            instanceId: "m2",
            cardId: id("bench"),
            level: 1,
            mp: 10,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: overrides?.hand ?? [id("p1_h1"), id("p1_h2")],
        deck: [id("d1"), id("d2"), id("d3")],
        discard: overrides?.discard ?? [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          {
            instanceId: "m3",
            cardId: id("opp_main"),
            level: 1,
            mp: overrides?.opponentMp ?? 50,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: overrides?.opponentHand ?? [id("opp_h1"), id("opp_h2")],
        deck: [id("e1"), id("e2")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [id("quest_1")],
    effectStack: [],
    eventLog: [],
    rngSeed: 7,
    lastRoll: null,
    currentTurnStartCount: 0,
    gameFlags: {}
  };
}

function invocation(playerChoices?: Record<string, unknown>) {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" },
    targetRef: { playerId: "p2", instanceId: "m3" },
    playerChoices
  } as const;
}

beforeEach(() => {
  clearRegistry();
  [DJ_8020, COERT_KASTELUCK, BINTI_THE_SHARP_TONGUE, BINTI_THE_CREATOR, CLESS_THE_TEACHER].forEach((card) =>
    registerCard(card)
  );
});

describe("phase8 step 5 - artistic batch 2 (5 mosjes)", () => {
  it("dj-8020 passive triggered turn-start gains 10 MP", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: DJ_8020.id, selfMp: 20 }),
      DJ_8020.id,
      invocation({})
    );

    expect(next.players[0].mosjes[0].mp).toBe(30);
  });

  it("coert-kasteluck passive triggered roll runs without crash", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: COERT_KASTELUCK.id, selfMp: 20 }),
      COERT_KASTELUCK.id,
      invocation({})
    );

    expect(typeof next.players[0].mosjes[0].mp).toBe("number");
  });

  it("binti-the-sharp-tongue deals 10 MP damage to opponent (discardRandom deferred)", () => {
    const next = executeMosjeAbility(
      createState({
        selfCardId: BINTI_THE_SHARP_TONGUE.id,
        selfMp: 20,
        opponentMp: 50,
        opponentHand: [id("opp_h1"), id("opp_h2")]
      }),
      BINTI_THE_SHARP_TONGUE.id,
      invocation({ discardCardId: "p1_h1" })
    );

    expect(next.players[1].mosjes[0].mp).toBe(40);
  });

  it("binti-the-creator fires mosje_ability_used without crashing", () => {
    const next = executeMosjeAbility(
      createState({
        selfCardId: BINTI_THE_CREATOR.id,
        selfMp: 60,
        hand: [id("food_1"), id("food_2")]
      }),
      BINTI_THE_CREATOR.id,
      invocation({ discardCardIds: ["food_1", "food_2"] })
    );

    expect(next.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });

  it("cless-the-teacher passive triggered roll runs without crash", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: CLESS_THE_TEACHER.id, selfMp: 10 }),
      CLESS_THE_TEACHER.id,
      invocation({})
    );

    expect(typeof next.players[0].mosjes[0].mp).toBe("number");
  });

  it("simulation runs five turns with artistic batch 2 without crashes", () => {
    let state = createState({ selfCardId: DJ_8020.id, selfMp: 20 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeTriggeredMosjeAbility(state, DJ_8020.id, invocation({}));
      state = { ...state, turnCount: state.turnCount + 1 };
    }

    expect(state.players[0].mosjes[0].mp).toBeGreaterThan(20);
  });
});
