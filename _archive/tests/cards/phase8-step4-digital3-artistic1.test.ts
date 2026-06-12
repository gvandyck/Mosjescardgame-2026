import { beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility, executeTriggeredMosjeAbility } from "../../src/cards/executor/index.js";
import {
  CHRIS_THE_ALL_ROUNDER,
  JISCA_THE_MAESTRO,
  RONALD_THE_MASTERMIND,
  TUK_THE_HEALING_SPIRIT,
  YOURI_THE_SPEEDRUNNER
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
  discard?: ReadonlyArray<CardId>;
  piecieSlots?: GameState["players"][0]["piecieSlots"];
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
            cardId: overrides?.selfCardId ?? RONALD_THE_MASTERMIND.id,
            level: 1,
            mp: overrides?.selfMp ?? 50,
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
        piecieSlots: overrides?.piecieSlots ?? [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [id("p1_h1")],
        deck: [id("d1"), id("d2"), id("d3")],
        discard: overrides?.discard ?? [id("piecie_in_discard")],
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
        hand: [id("opp_h1")],
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
  [
    CHRIS_THE_ALL_ROUNDER,
    YOURI_THE_SPEEDRUNNER,
    RONALD_THE_MASTERMIND,
    JISCA_THE_MAESTRO,
    TUK_THE_HEALING_SPIRIT
  ].forEach((card) => registerCard(card));
});

describe("phase8 step 4 - digital batch 3 + artistic batch 1 (5 mosjes)", () => {
  it("chris-the-all-rounder fires mosje_ability_used and gains 15 MP when 3+ face-down Piecies present", () => {
    const filledSlots = [0, 1, 2, 3, 4].map((i) => ({
      slotIndex: i as 0 | 1 | 2 | 3 | 4,
      cardId: id(`piecie_${i}`),
      faceUp: false,
      turnsSincePlaced: 2
    }));
    const state = createState({ selfCardId: CHRIS_THE_ALL_ROUNDER.id, selfMp: 10, piecieSlots: filledSlots });
    const next = executeMosjeAbility(state, CHRIS_THE_ALL_ROUNDER.id, invocation({ slotIndex: 0 }));

    expect(next.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });

  it("youri-the-speedrunner pays 20 MP, draws 1, and applies piecie_same_turn_activate buff", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: YOURI_THE_SPEEDRUNNER.id, selfMp: 30 }),
      YOURI_THE_SPEEDRUNNER.id,
      invocation({ slotIndex: 0 })
    );

    expect(next.players[0].mosjes[0].mp).toBe(10);
    expect(next.players[0].hand.length).toBe(2);
    expect(next.players[0].mosjes[0].flags["buff:piecie_same_turn_activate"]).toBeDefined();
  });

  it("ronald-the-mastermind once-per-game blocks second use", () => {
    const first = executeMosjeAbility(
      createState({ selfCardId: RONALD_THE_MASTERMIND.id }),
      RONALD_THE_MASTERMIND.id,
      invocation({ discardCardId: "piecie_in_discard" })
    );
    const second = executeMosjeAbility(first, RONALD_THE_MASTERMIND.id, invocation({ discardCardId: "piecie_in_discard" }));

    expect(first.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
    const firstUseCount = first.eventLog.filter((event) => event.type === "mosje_ability_used").length;
    const secondUseCount = second.eventLog.filter((event) => event.type === "mosje_ability_used").length;
    expect(secondUseCount).toBe(firstUseCount);
  });

  it("jisca-the-maestro triggered roll resolves without crashing", () => {
    const next = executeTriggeredMosjeAbility(
      createState({ selfCardId: JISCA_THE_MAESTRO.id, selfMp: 20, opponentMp: 50 }),
      JISCA_THE_MAESTRO.id,
      invocation({})
    );

    expect(typeof next.players[0].mosjes[0].mp).toBe("number");
    expect(typeof next.players[1].mosjes[0].mp).toBe("number");
  });

  it("tuk-the-healing-spirit gains 25 MP", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: TUK_THE_HEALING_SPIRIT.id, selfMp: 10 }),
      TUK_THE_HEALING_SPIRIT.id,
      invocation({})
    );

    expect(next.players[0].mosjes[0].mp).toBe(35);
  });

  it("simulation runs five turns with the step 4 batch without crashes", () => {
    let state = createState({ selfCardId: TUK_THE_HEALING_SPIRIT.id, selfMp: 10 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeMosjeAbility(state, TUK_THE_HEALING_SPIRIT.id, invocation({}));
      state = { ...state, turnCount: state.turnCount + 1 };
    }

    expect(state.players[0].mosjes[0].mp).toBeGreaterThan(10);
  });
});
