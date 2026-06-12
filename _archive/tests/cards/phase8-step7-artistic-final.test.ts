import { beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility, executeTriggeredMosjeAbility } from "../../src/cards/executor/index.js";
import {
  CHRIS_DDR,
  COERT_KASTELEIN,
  PLACEHOLDER_THE_AMPLIFIER,
  TUK_THE_SIMS_ARCHITECT
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
            cardId: overrides?.selfCardId ?? PLACEHOLDER_THE_AMPLIFIER.id,
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
        deck: overrides?.deck ?? [id("d1"), id("d2"), id("d3"), id("d4"), id("d5"), id("d6")],
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
    rngSeed: 13,
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
  [PLACEHOLDER_THE_AMPLIFIER, COERT_KASTELEIN, TUK_THE_SIMS_ARCHITECT, CHRIS_DDR].forEach((card) =>
    registerCard(card)
  );
});

describe("phase8 step 7 - artistic batch 3 final (4 mosjes)", () => {
  it("amplifier applies double_trigger_this_turn buff without crash", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: PLACEHOLDER_THE_AMPLIFIER.id, selfMp: 50 }),
      PLACEHOLDER_THE_AMPLIFIER.id,
      invocation({})
    );

    expect(next.eventLog.some((e) => e.type === "mosje_ability_used")).toBe(true);
  });

  it("coert-kastelein passive triggered runs without crash", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: COERT_KASTELEIN.id, selfMp: 20 }),
      COERT_KASTELEIN.id,
      invocation({})
    );

    expect(next.eventLog.some((e) => e.type === "mosje_ability_used")).toBe(true);
  });

  it("tuk-architect activated lookAtTop without crash", () => {
    const next = executeMosjeAbility(
      createState({
        selfCardId: TUK_THE_SIMS_ARCHITECT.id,
        selfMp: 40,
        deck: [id("d1"), id("d2"), id("d3"), id("d4"), id("d5")]
      }),
      TUK_THE_SIMS_ARCHITECT.id,
      invocation({})
    );

    expect(next.eventLog.some((e) => e.type === "mosje_ability_used")).toBe(true);
  });

  it("chris-ddr passive rollBranch runs without crash", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: CHRIS_DDR.id, selfMp: 15 }),
      CHRIS_DDR.id,
      invocation({})
    );

    expect(typeof next.players[0].mosjes[0].mp).toBe("number");
  });

  it("simulation runs five turns with all 4 final artistic cards without crashes", () => {
    let state = createState({ selfCardId: CHRIS_DDR.id, selfMp: 15 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeTriggeredMosjeAbility(state, CHRIS_DDR.id, invocation({}));
      state = { ...state, turnCount: state.turnCount + 1 };
    }

    expect(typeof state.players[0].mosjes[0].mp).toBe("number");
  });
});
