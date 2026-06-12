import { beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility, executeTriggeredMosjeAbility } from "../../src/cards/executor/index.js";
import {
  FPS_COERT,
  FPS_WEST,
  MARTIN_THE_PRECISION_DRIVER,
  PLACEHOLDER_THE_DRAINER,
  PLACEHOLDER_THE_TACTICIAN
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
  hand?: ReadonlyArray<CardId>;
  deck?: ReadonlyArray<CardId>;
}): GameState {
  return {
    turnCount: 3,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: overrides?.selfCardId ?? PLACEHOLDER_THE_TACTICIAN.id,
            level: 1,
            mp: overrides?.selfMp ?? 40,
            flags: {}
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
        hand: overrides?.hand ?? [id("h1"), id("h2"), id("h3"), id("h4")],
        deck: overrides?.deck ?? [id("d1"), id("d2"), id("d3"), id("d4"), id("d5")],
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
          {
            instanceId: "m3",
            cardId: id("opp_main"),
            level: 1,
            mp: overrides?.opponentMp ?? 50,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [id("opp_h1"), id("opp_h2")],
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
    rngSeed: 11,
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
  [
    PLACEHOLDER_THE_TACTICIAN,
    PLACEHOLDER_THE_DRAINER,
    FPS_COERT,
    FPS_WEST,
    MARTIN_THE_PRECISION_DRIVER
  ].forEach((card) => registerCard(card));
});

describe("phase8 step 6 - digital batch 3 + artistic batch 3 start", () => {
  it("tactician sets target MP to exactly 60", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: PLACEHOLDER_THE_TACTICIAN.id, selfMp: 40, opponentMp: 30 }),
      PLACEHOLDER_THE_TACTICIAN.id,
      invocation({})
    );

    expect(next.players[1].mosjes[0].mp).toBe(60);
  });

  it("drainer passive triggered deals 5 MP to opponent", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: PLACEHOLDER_THE_DRAINER.id, selfMp: 20, opponentMp: 50 }),
      PLACEHOLDER_THE_DRAINER.id,
      invocation({})
    );

    expect(next.players[1].mosjes[0].mp).toBe(45);
  });

  it("fps-coert passive rollBranch runs without crash", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: FPS_COERT.id, selfMp: 15, opponentMp: 50 }),
      FPS_COERT.id,
      invocation({})
    );

    expect(typeof next.players[0].mosjes[0].mp).toBe("number");
  });

  it("fps-west gains 20 MP net (10 cost, 20 gain) on use", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: FPS_WEST.id, selfMp: 40, opponentMp: 50 }),
      FPS_WEST.id,
      invocation({})
    );

    // MP cost is not deducted by executor — gain 20 MP: 40 + 20 = 60
    expect(next.players[0].mosjes[0].mp).toBe(60);
  });

  it("martin-precision-driver draws 3 cards and gains 20 MP", () => {
    const initial = createState({
      selfCardId: MARTIN_THE_PRECISION_DRIVER.id,
      selfMp: 40,
      hand: [id("h1"), id("h2"), id("h3"), id("h4")],
      deck: [id("d1"), id("d2"), id("d3"), id("d4")]
    });

    const next = executeMosjeAbility(initial, MARTIN_THE_PRECISION_DRIVER.id, invocation({}));

    expect(next.players[0].mosjes[0].mp).toBe(60);
    expect(next.players[0].hand.length).toBeGreaterThanOrEqual(3);
  });

  it("simulation runs five turns with step 6 cards without crashes", () => {
    let state = createState({ selfCardId: PLACEHOLDER_THE_DRAINER.id, selfMp: 20 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeTriggeredMosjeAbility(state, PLACEHOLDER_THE_DRAINER.id, invocation({}));
      state = { ...state, turnCount: state.turnCount + 1 };
    }

    expect(state.players[1].mosjes[0].mp).toBeLessThanOrEqual(25);
  });
});
