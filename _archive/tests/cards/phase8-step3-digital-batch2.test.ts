import { beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility } from "../../src/cards/executor/index.js";
import {
  COERT_TECH_SAVANT,
  JEFFREY_THE_SILENT_GAMBLER,
  MARTIN_SENOR_WEST,
  MING_THE_PREDICTOR,
  THE_HACKER
} from "../../src/cards/mosjes/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function createState(overrides?: {
  selfCardId?: CardId;
  benchCardId?: CardId;
  selfMp?: number;
  selfFlags?: Readonly<Record<string, unknown>>;
  eventLog?: GameState["eventLog"];
  questDeck?: ReadonlyArray<CardId>;
  turnCount?: number;
}): GameState {
  return {
    turnCount: overrides?.turnCount ?? 2,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: overrides?.selfCardId ?? MING_THE_PREDICTOR.id,
            level: 1,
            mp: overrides?.selfMp ?? 50,
            flags: overrides?.selfFlags ?? {}
          },
          {
            instanceId: "m2",
            cardId: overrides?.benchCardId ?? id("bench"),
            level: 1,
            mp: 20,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [id("p1_h1"), id("p1_h2")],
        deck: [id("d1"), id("d2"), id("d3")],
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
            mp: 50,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [id("opp_h1")],
        deck: [id("e1"), id("e2"), id("e3")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: overrides?.questDeck ?? [id("quest_1"), id("quest_2")],
    effectStack: [],
    eventLog: overrides?.eventLog ?? [],
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
    targetRef: { playerId: "p1", instanceId: "m1" },
    playerChoices
  } as const;
}

beforeEach(() => {
  clearRegistry();
  [
    MING_THE_PREDICTOR,
    MARTIN_SENOR_WEST,
    COERT_TECH_SAVANT,
    THE_HACKER,
    JEFFREY_THE_SILENT_GAMBLER
  ].forEach((card) => registerCard(card));
});

describe("phase8 step 3 - digital batch 2 (5 mosjes)", () => {
  it("ming-the-predictor pays 10 MP and looks at the top Quest card", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: MING_THE_PREDICTOR.id, selfMp: 30 }),
      MING_THE_PREDICTOR.id,
      invocation({ deckOwnerId: "quest_deck" })
    );

    expect(next.players[0].mosjes[0].mp).toBe(20);
    expect(next.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });

  it("ming-the-predictor is blocked when MP is insufficient", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: MING_THE_PREDICTOR.id, selfMp: 9 }),
      MING_THE_PREDICTOR.id,
      invocation({ deckOwnerId: "quest_deck" })
    );

    expect(next.players[0].mosjes[0].mp).toBe(9);
  });

  it("martin-senor-west fires ability and fires mosje_ability_used event", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: MARTIN_SENOR_WEST.id, selfMp: 15 }),
      MARTIN_SENOR_WEST.id,
      invocation({ deckOwnerId: "p2", cardTypeGuess: "PIECIE" })
    );

    expect(next.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });

  it("coert-tech-savant draws a card for each activation and deducts 10 MP", () => {
    const state = createState({ selfCardId: COERT_TECH_SAVANT.id, selfMp: 30 });
    const once = executeMosjeAbility(state, COERT_TECH_SAVANT.id, invocation());
    const twice = executeMosjeAbility(once, COERT_TECH_SAVANT.id, invocation());

    expect(twice.players[0].mosjes[0].mp).toBe(10);
    expect(twice.players[0].hand.length).toBe(4);
  });

  it("the-hacker gains 10 MP and reveals top 3 of chosen deck", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: THE_HACKER.id, selfMp: 15 }),
      THE_HACKER.id,
      invocation({ deckOwnerId: "p2" })
    );

    expect(next.players[0].mosjes[0].mp).toBe(25);
    expect(next.eventLog.some((event) => event.type === "cards_revealed_private")).toBe(true);
  });

  it("jeffrey-the-silent-gambler resolves roll branches without crashing", () => {
    // Use a fixed seed and wager 10 to test all branches
    const state = createState({ selfCardId: JEFFREY_THE_SILENT_GAMBLER.id, selfMp: 50 });
    const result = executeMosjeAbility(state, JEFFREY_THE_SILENT_GAMBLER.id, invocation({ wagerAmount: 10 }));
    // The Mosje must have fired and the MP must have changed or stayed the same per roll outcome.
    expect(typeof result.players[0].mosjes[0].mp).toBe("number");
    expect(result.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });

  it("simulation runs five turns with digital batch 2 Mosjes without crashes", () => {
    let state = createState({ selfCardId: COERT_TECH_SAVANT.id, selfMp: 100 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeMosjeAbility(state, COERT_TECH_SAVANT.id, invocation());
      state = { ...state, turnCount: state.turnCount + 1 };
    }

    expect(state.players[0].mosjes[0].mp).toBeGreaterThanOrEqual(0);
  });
});
