import { beforeEach, describe, expect, it } from "vitest";
import {
  executeCard,
  executeMosjeAbility,
  executeTriggeredMosjeAbility
} from "../../src/cards/executor/index.js";
import {
  ALYSSA_THE_BULLDOZER,
  GANDOE_THE_WIZARD,
  JEFFREY_THE_STRONGMAN,
  MICHELLE_IRON_TUK,
  PARKOUR_WEST
} from "../../src/cards/mosjes/fighting/index.js";
import { KANNETJE_MELK } from "../../src/cards/piecies/momentum-gaining/kannetje-melk.js";
import { TE_HARD_GAAN } from "../../src/cards/piecies/attack/te-hard-gaan.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { startTurn } from "../../src/engine/start-turn.js";
import { createRng } from "../../src/utils/rng.js";
import type { MosjeDefinition } from "../../src/cards/schema/mosje-definition.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function makePartner(cardId: CardId): MosjeDefinition {
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
    mosjeType: "ARTISTIC",
    traits: { Physical: 0, Mental: 0, Social: 0, Creative: 0, Technical: 0, Resilient: 0 },
    startMP: 10,
    baseAbility: {
      trigger: "passive",
      usageLimit: "passive",
      description: "",
      effects: []
    }
  };
}

function findSeedForRange(min: number, max: number): number {
  for (let seed = 1; seed < 5000; seed += 1) {
    const roll = createRng(seed).rollD6();
    if (roll >= min && roll <= max) return seed;
  }
  throw new Error(`No seed found for range ${min}-${max}`);
}

function createState(overrides?: {
  seed?: number;
  selfCardId?: CardId;
  benchCardId?: CardId;
  opponentCardId?: CardId;
  opponentBenchCardId?: CardId;
  selfMp?: number;
  opponentMp?: number;
  selfFlags?: Readonly<Record<string, unknown>>;
  opponentFlags?: Readonly<Record<string, unknown>>;
  hand?: ReadonlyArray<CardId>;
}): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: overrides?.selfCardId ?? GANDOE_THE_WIZARD.id,
            level: 1,
            mp: overrides?.selfMp ?? 20,
            flags: overrides?.selfFlags ?? {}
          },
          {
            instanceId: "m2",
            cardId: overrides?.benchCardId ?? id("bench"),
            level: 1,
            mp: 10,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: overrides?.hand ?? [],
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
            cardId: overrides?.opponentCardId ?? id("opp_a"),
            level: 1,
            mp: overrides?.opponentMp ?? 20,
            flags: overrides?.opponentFlags ?? {}
          },
          {
            instanceId: "m4",
            cardId: overrides?.opponentBenchCardId ?? id("opp_b"),
            level: 1,
            mp: 20,
            flags: {}
          }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [id("opp_restore")],
        deck: [id("e1"), id("e2")],
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
    eventLog: [],
    rngSeed: overrides?.seed ?? 1,
    lastRoll: null,
    currentTurnStartCount: 0,
    gameFlags: {}
  };
}

function activeInvocation() {
  return {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" },
    targetRef: { playerId: "p2", instanceId: "m3" }
  } as const;
}

beforeEach(() => {
  clearRegistry();
  [
    GANDOE_THE_WIZARD,
    JEFFREY_THE_STRONGMAN,
    ALYSSA_THE_BULLDOZER,
    MICHELLE_IRON_TUK,
    PARKOUR_WEST,
    KANNETJE_MELK,
    TE_HARD_GAAN,
    makePartner(id("jisca-the-maestro"))
  ].forEach((card) => registerCard(card));
});

describe("phase8 step 1 - fighting mosjes batch 1", () => {
  it("gandoe-the-wizard covers all three roll branches", () => {
    const low = executeTriggeredMosjeAbility(
      createState({ seed: findSeedForRange(1, 2), selfCardId: GANDOE_THE_WIZARD.id }),
      GANDOE_THE_WIZARD.id,
      { ...activeInvocation(), allowPassiveTrigger: true }
    );
    expect(low.players[0].mosjes[0].mp).toBe(10);

    const mid = executeTriggeredMosjeAbility(
      createState({ seed: findSeedForRange(3, 4), selfCardId: GANDOE_THE_WIZARD.id }),
      GANDOE_THE_WIZARD.id,
      { ...activeInvocation(), allowPassiveTrigger: true }
    );
    expect(mid.players[0].mosjes[0].mp).toBe(20);

    const high = executeTriggeredMosjeAbility(
      createState({ seed: findSeedForRange(5, 6), selfCardId: GANDOE_THE_WIZARD.id }),
      GANDOE_THE_WIZARD.id,
      { ...activeInvocation(), allowPassiveTrigger: true }
    );
    expect(high.players[0].mosjes[0].mp).toBe(40);
    expect(high.players[0].hand).toEqual([id("d1")]);
  });

  it("jeffrey-the-strongman gains 20, applies lock, and blocks second use this turn", () => {
    const state = createState({ selfCardId: JEFFREY_THE_STRONGMAN.id, selfMp: 15, opponentMp: 25 });
    const first = executeMosjeAbility(state, JEFFREY_THE_STRONGMAN.id, activeInvocation());
    const second = executeMosjeAbility(first, JEFFREY_THE_STRONGMAN.id, activeInvocation());

    expect(first.players[0].mosjes[0].mp).toBe(35);
    expect(first.players[1].mosjes[0].flags["buff:piecie_mp_restore_locked"]).toBeDefined();
    expect(second.players[0].mosjes[0].mp).toBe(35);
  });

  it("alyssa-the-bulldozer gets base gain, damage bonus, and Jisca synergy draw", () => {
    const state = {
      ...createState({
        selfCardId: ALYSSA_THE_BULLDOZER.id,
        benchCardId: id("jisca-the-maestro"),
        selfFlags: {}
      }),
      eventLog: [
        {
          type: "mp_lost",
          target: { playerId: "p1", instanceId: "m1" },
          amount: 30,
          source: { kind: "card", cardId: id("x") }
        }
      ]
    } as GameState;

    const next = executeTriggeredMosjeAbility(state, ALYSSA_THE_BULLDOZER.id, {
      ...activeInvocation(),
      allowPassiveTrigger: true
    });

    expect(next.players[0].mosjes[0].mp).toBe(55);
    expect(next.players[0].hand).toEqual([id("d1")]);
  });

  it("michelle-iron-tuk covers all roll branches and pet synergy bonus", () => {
    const low = executeMosjeAbility(
      createState({ seed: findSeedForRange(1, 2), selfCardId: MICHELLE_IRON_TUK.id }),
      MICHELLE_IRON_TUK.id,
      activeInvocation()
    );
    expect(low.players[0].mosjes[0].mp).toBe(5);

    const mid = executeMosjeAbility(
      createState({ seed: findSeedForRange(3, 4), selfCardId: MICHELLE_IRON_TUK.id }),
      MICHELLE_IRON_TUK.id,
      activeInvocation()
    );
    expect(mid.players[0].mosjes[0].mp).toBe(35);

    const highWithPet = executeMosjeAbility(
      createState({
        seed: findSeedForRange(5, 6),
        selfCardId: MICHELLE_IRON_TUK.id,
        selfFlags: { "buff:pet_active:bowie-stormey": { data: true, expiryTurn: 99 } }
      }),
      MICHELLE_IRON_TUK.id,
      activeInvocation()
    );
    expect(highWithPet.players[0].mosjes[0].mp).toBe(60);
  });

  it("parkour-west applies next_piecie_free and executor consumes it", () => {
    const buffed = executeTriggeredMosjeAbility(
      createState({ selfCardId: PARKOUR_WEST.id, selfMp: 20 }),
      PARKOUR_WEST.id,
      { ...activeInvocation(), allowPassiveTrigger: true }
    );
    expect(buffed.players[0].mosjes[0].flags["buff:next_piecie_free"]).toBeDefined();

    const withCardInHand = {
      ...buffed,
      players: buffed.players.map((player) =>
        player.id !== "p1" ? player : { ...player, hand: [TE_HARD_GAAN.id] }
      )
    };
    const next = executeCard(withCardInHand, TE_HARD_GAAN.id, activeInvocation());

    expect(next.players[0].mosjes[0].mp).toBe(20);
    expect(next.players[1].mosjes[0].mp).toBe(-5);
    expect(next.players[0].mosjes[0].flags["buff:next_piecie_free"]).toBeUndefined();
  });

  it("simulation runs five turns without crashing and clears once-per-turn flags", () => {
    let state = createState({ selfCardId: JEFFREY_THE_STRONGMAN.id, benchCardId: ALYSSA_THE_BULLDOZER.id, selfMp: 20 });

    for (let turn = 0; turn < 5; turn += 1) {
      state = executeMosjeAbility(state, JEFFREY_THE_STRONGMAN.id, activeInvocation());
      state = startTurn({ ...state, currentPlayerId: "p1", turnCount: state.turnCount + 1 });
    }

    expect(state.eventLog.some((event) => event.type === "mosje_ability_used")).toBe(true);
    expect(state.players[0].mosjes[0].flags["ability_used_this_turn"]).toBeUndefined();
  });
});
