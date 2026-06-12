import { beforeEach, describe, expect, it } from "vitest";
import {
  executeMosjeAbility,
  executeTriggeredMosjeAbility
} from "../../src/cards/executor/index.js";
import {
  AZN_CLESS,
  GANDOE_THE_DESTROYER,
  MARTIN_THE_HISTORIAN,
  MING_THE_NATURAL,
  RONALD_THE_MASTER_CHEF
} from "../../src/cards/mosjes/index.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { MosjeDefinition } from "../../src/cards/schema/mosje-definition.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function makePartner(cardId: CardId, mosjeType: "FIGHTING" | "DIGITAL" | "ARTISTIC" = "DIGITAL"): MosjeDefinition {
  return {
    id: cardId,
    name: String(cardId),
    category: "mosje",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "passive",
    duration: "while_active",
    effects: [],
    mosjeType,
    traits: { Physical: 0, Mental: 0, Social: 0, Creative: 0, Technical: 0, Resilient: 0 },
    startMP: 10,
    baseAbility: { trigger: "passive", usageLimit: "passive", description: "", effects: [] }
  };
}

function createState(overrides?: {
  selfCardId?: CardId;
  benchCardId?: CardId;
  opponentCardId?: CardId;
  selfMp?: number;
  opponentMp?: number;
  selfFlags?: Readonly<Record<string, unknown>>;
  eventLog?: GameState["eventLog"];
  hand?: ReadonlyArray<CardId>;
  playerChoicesDeckOwnerId?: CardId;
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
            cardId: overrides?.selfCardId ?? GANDOE_THE_DESTROYER.id,
            level: 1,
            mp: overrides?.selfMp ?? 100,
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
        hand: overrides?.hand ?? [id("p1_h1"), id("p1_h2"), id("p1_h3")],
        deck: [id("d1"), id("d2"), id("d3")],
        discard: [id("discard_card")],
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
            cardId: overrides?.opponentCardId ?? id("opp_main"),
            level: 1,
            mp: overrides?.opponentMp ?? 50,
            flags: {}
          },
          {
            instanceId: "m4",
            cardId: id("opp_bench"),
            level: 1,
            mp: 20,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [id("opp_locked"), id("opp_extra")],
        deck: [id("e1"), id("e2"), id("e3")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
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
    targetRef: { playerId: "p2", instanceId: "m3" },
    playerChoices
  } as const;
}

beforeEach(() => {
  clearRegistry();
  [
    GANDOE_THE_DESTROYER,
    AZN_CLESS,
    RONALD_THE_MASTER_CHEF,
    MING_THE_NATURAL,
    MARTIN_THE_HISTORIAN,
    makePartner(id("west-sr-tactical"), "FIGHTING"),
    makePartner(id("martin-senor-west"), "DIGITAL")
  ].forEach((card) => registerCard(card));
});

describe("phase8 step 2 - fighting batch 2 + digital batch 1", () => {
  it("gandoe-the-destroyer defeats low-MP target and rejects further use", () => {
    const state = createState({ selfCardId: GANDOE_THE_DESTROYER.id, selfMp: 100, opponentMp: 60 });
    const first = executeMosjeAbility(state, GANDOE_THE_DESTROYER.id, invocation());
    const second = executeMosjeAbility(first, GANDOE_THE_DESTROYER.id, invocation());

    expect(first.players[0].mosjes[0].mp).toBe(20);
    expect(first.players[1].mosjes[0].flags.in_welloe).toBe(true);
    expect(second.players[0].mosjes[0].mp).toBe(20);
  });

  it("gandoe-the-destroyer does nothing when target MP is above threshold", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: GANDOE_THE_DESTROYER.id, selfMp: 100, opponentMp: 61 }),
      GANDOE_THE_DESTROYER.id,
      invocation()
    );
    expect(next.players[1].mosjes[0].flags.in_welloe).toBeUndefined();
  });

  it("azn-cless gains, draws, gets partner bonus, and vianna-poes pet bonus", () => {
    const next = executeMosjeAbility(
      createState({
        selfCardId: AZN_CLESS.id,
        benchCardId: id("west-sr-tactical"),
        selfMp: 20,
        selfFlags: { "buff:pet_active:vianna-poes": { data: true, expiryTurn: 99 } },
        hand: [id("discard_me")]
      }),
      AZN_CLESS.id,
      invocation({ discardCardId: "discard_me" })
    );

    expect(next.players[0].mosjes[0].mp).toBe(35);
    expect(next.players[0].hand).toEqual([id("d1"), id("d2"), id("d3")]);
  });

  it("ronald-the-master-chef reveals opponent hand and applies the lock buff", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: RONALD_THE_MASTER_CHEF.id, selfMp: 40 }),
      RONALD_THE_MASTER_CHEF.id,
      invocation({ lockedCardId: "opp_locked" })
    );

    expect(next.eventLog.some((event) => event.type === "cards_revealed_private")).toBe(true);
    expect(next.players[1].mosjes[0].flags["buff:card_locked_in_hand"]).toBeDefined();
  });

  it("ming-the-natural gains 15 only when a card draw happened this turn", () => {
    const withDraw = executeMosjeAbility(
      createState({
        selfCardId: MING_THE_NATURAL.id,
        selfMp: 0,
        eventLog: [{ type: "card_drawn", playerId: "p1", cardId: id("drawn") }]
      }),
      MING_THE_NATURAL.id,
      invocation({})
    );
    expect(withDraw.players[0].mosjes[0].mp).toBe(15);

    const withoutDraw = executeMosjeAbility(
      createState({ selfCardId: MING_THE_NATURAL.id, selfMp: 0 }),
      MING_THE_NATURAL.id,
      invocation({})
    );
    expect(withoutDraw.players[0].mosjes[0].mp).toBe(0);
  });

  it("martin-the-historian gains, draws, and looks at the chosen deck", () => {
    const next = executeMosjeAbility(
      createState({ selfCardId: MARTIN_THE_HISTORIAN.id, selfMp: 10 }),
      MARTIN_THE_HISTORIAN.id,
      invocation({ deckOwnerId: "p2" })
    );

    expect(next.players[0].mosjes[0].mp).toBe(25);
    expect(next.players[0].hand).toEqual([id("p1_h1"), id("p1_h2"), id("p1_h3"), id("d1"), id("d2")]);
    expect(next.eventLog.some((event) => event.type === "cards_revealed_private")).toBe(true);
  });

  it("simulation runs five turns with the mixed batch without crashes", () => {
    let state = createState({ selfCardId: AZN_CLESS.id, benchCardId: id("martin-senor-west"), hand: [id("discard_me")] });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeMosjeAbility(state, AZN_CLESS.id, invocation({ discardCardId: "discard_me" }));
      state = {
        ...state,
        turnCount: state.turnCount + 1,
        eventLog: [...state.eventLog, { type: "card_drawn", playerId: "p1", cardId: id(`draw_${turn}`) }]
      };
      state = executeTriggeredMosjeAbility(
        { ...state, players: state.players.map((player) => player.id !== "p1" ? player : { ...player, mosjes: player.mosjes.map((mosje, index) => index === 0 ? { ...mosje, cardId: MING_THE_NATURAL.id } : mosje) }) },
        MING_THE_NATURAL.id,
        invocation({})
      );
    }

    expect(state.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
  });
});
