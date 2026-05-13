import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility } from "../../src/cards/executor/execute-mosje-ability.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import type { MosjeDefinition } from "../../src/cards/schema/mosje-definition.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function createState(cardId: CardId, mp = 20): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId, level: 1, mp, flags: { traits: { Physical: 0 } } },
          { instanceId: "m2", cardId: id("bench"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
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
          { instanceId: "m3", cardId: id("opp_a"), level: 1, mp: 20, flags: {} },
          { instanceId: "m4", cardId: id("opp_b"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
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
    rngSeed: 42,
    lastRoll: null,
    gameFlags: {}
  };
}

function baseMosje(cardId: CardId): MosjeDefinition {
  return {
    id: cardId,
    name: "Ability Test",
    category: "mosje",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "on_play",
    duration: "instant",
    effects: [],
    mosjeType: "DIGITAL",
    traits: { Physical: 0, Mental: 1, Social: 0, Creative: 0, Technical: 1, Resilient: 0 },
    startMP: 20,
    baseAbility: {
      trigger: "on_play",
      usageLimit: "once_per_turn",
      cost: { type: "free" },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
      description: "Gain MP"
    }
  };
}

describe("executeMosjeAbility", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("respects once-per-turn limits", () => {
    const card = baseMosje(id("mosje_turn"));
    registerCard(card);

    const state = createState(card.id, 20);
    const first = executeMosjeAbility(state, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const second = executeMosjeAbility(first, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(first.players[0].mosjes[0].mp).toBe(30);
    expect(second.players[0].mosjes[0].mp).toBe(30);
    expect(first.players[0].mosjes[0].flags.ability_used_this_turn).toBe(true);
  });

  it("reduces ability MP costs and auto-applies synergy in chamber", () => {
    const card: MosjeDefinition = {
      ...baseMosje(id("mosje_chamber")),
      baseAbility: {
        trigger: "on_play",
        usageLimit: "once_per_turn",
        cost: { type: "mp", mp: 10 },
        effects: [],
        description: "Chamber test"
      },
      synergies: [
        {
          partnerCardId: id("missing_partner"),
          bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 7 } }],
          description: "Partner bonus"
        }
      ]
    };
    registerCard(card);

    const state = {
      ...createState(card.id, 10),
      gameFlags: { synergy_chamber_active: true }
    };

    const next = executeMosjeAbility(state, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(next.players[0].mosjes[0].mp).toBe(12);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "mosje_ability_used" });
  });

  it("applies pet synergies when matching pet flag is active", () => {
    const card: MosjeDefinition = {
      ...baseMosje(id("mosje_pet")),
      baseAbility: {
        trigger: "on_play",
        usageLimit: "once_per_turn",
        cost: { type: "free" },
        effects: [],
        description: "Pet test"
      },
      petSynergies: [
        {
          petCardId: id("pet_boost"),
          bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 9 } }]
        }
      ]
    };
    registerCard(card);

    const state = {
      ...createState(card.id, 20),
      players: createState(card.id, 20).players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1"
                  ? mosje
                  : {
                      ...mosje,
                      flags: {
                        ...mosje.flags,
                        "buff:pet_active:pet_boost": { data: true, expiryTurn: 99 }
                      }
                    }
              )
            }
      )
    };

    const next = executeMosjeAbility(state, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(next.players[0].mosjes[0].mp).toBe(29);
  });

  it("consumes double activation buff to run ability effects twice without reopening once-per-turn use", () => {
    const card = baseMosje(id("mosje_double"));
    registerCard(card);

    const state = {
      ...createState(card.id, 20),
      players: createState(card.id, 20).players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1"
                  ? mosje
                  : {
                      ...mosje,
                      flags: {
                        ...mosje.flags,
                        "buff:double_activate_this_turn": { data: { usesRemaining: 1 }, expiryTurn: 1 }
                      }
                    }
              )
            }
      )
    };

    const next = executeMosjeAbility(state, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const second = executeMosjeAbility(next, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(next.players[0].mosjes[0].mp).toBe(40);
    expect(next.players[0].mosjes[0].flags["buff:double_activate_this_turn"]).toBeUndefined();
    expect(next.players[0].mosjes[0].flags.ability_used_this_turn).toBe(true);
    expect(next.eventLog.some((event) => event.type === "double_activation_triggered")).toBe(true);
    expect(second.players[0].mosjes[0].mp).toBe(40);
  });

  it("respects once-per-game limits", () => {
    const card: MosjeDefinition = {
      ...baseMosje(id("mosje_once_game")),
      baseAbility: {
        trigger: "on_play",
        usageLimit: "once_per_game",
        cost: { type: "free" },
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }],
        description: "Once per game"
      }
    };
    registerCard(card);

    const state = createState(card.id, 10);
    const first = executeMosjeAbility(state, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const second = executeMosjeAbility(first, card.id, {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(first.players[0].mosjes[0].mp).toBe(15);
    expect(second.players[0].mosjes[0].mp).toBe(15);
    expect(first.players[0].mosjes[0].flags.ability_used_this_game).toBe(true);
  });
});
