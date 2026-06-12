import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { pushPendingEffect, resolveEffectStack } from "../../src/engine/resolve-effect-stack.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";
import type { PendingEffect } from "../../src/types/pending-effect.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(overrides: { selfMp?: number; traits?: Record<string, number>; hand?: string[] } = {}): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: cardId("c1"),
            level: 2,
            mp: overrides.selfMp ?? 60,
            flags: overrides.traits !== undefined ? { traits: overrides.traits } : {}
          }
        ],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({
          slotIndex,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: (overrides.hand ?? []).map((id) => cardId(id)),
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
    rngSeed: 1,
    lastRoll: null};
}

function makePendingLoseMP(id: string, playerId: string, instanceId: string, amount: number): PendingEffect {
  return {
    id,
    source: { kind: "card", cardId: cardId("external-attack") },
    primitive: "loseMP",
    params: { target: { playerId, instanceId }, amount },
    canBeCountered: true
  };
}

function makePendingGainMP(id: string, playerId: string, instanceId: string, amount: number): PendingEffect {
  return {
    id,
    source: { kind: "card", cardId: cardId("external-gain") },
    primitive: "gainMP",
    params: { target: { playerId, instanceId }, amount },
    canBeCountered: true
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard({
    id: cardId("snelle_counter_strikka"),
    name: "Counter Strikka",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "mp", mp: 15 },
    requirements: [{ type: "trait", params: { trait: "Mental", minStars: 2 } }],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
      {
        primitive: "ifThenElse",
        params: {
          condition: { condition: "checkTrait", params: { target: "$self", trait: "Mental", minStars: 3 } },
          then: { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
        }
      }
    ]
  });
  registerCard({
    id: cardId("snelle_perfect_dodge"),
    name: "Perfect Dodge",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "mp", mp: 20 },
    requirements: [{ type: "trait", params: { trait: "Physical", minStars: 2 } }],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      {
        primitive: "ifThenElse",
        params: {
          condition: { primitive: "checkTrait", params: { target: "$self", trait: "Physical", minStars: 3 } },
          then: {
            primitive: "chain",
            params: {
              effects: [
                { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
                { primitive: "gainMP", params: { target: "$self", amount: 15 } }
              ]
            }
          },
          else: {
            primitive: "ifThenElse",
            params: {
              condition: { primitive: "checkPendingEffectAmount", params: { operator: ">=", value: 30 } },
              then: {
                primitive: "chain",
                params: {
                  effects: [
                    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
                    { primitive: "gainMP", params: { target: "$self", amount: 15 } }
                  ]
                }
              },
              else: { primitive: "gainMP", params: { target: "$self", amount: 15 } }
            }
          }
        }
      }
    ]
  });
  registerCard({
    id: cardId("snelle_jammertje_gepakt"),
    name: "Jammertje Gepakt",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "mp", mp: 20 },
    requirements: [{ type: "trait", params: { trait: "Mental", minStars: 3 } }],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
      { primitive: "sendToBottomOfDeck", params: { playerId: "$player", cardId: "$pendingEffectCardId" } },
      {
        primitive: "ifThenElse",
        params: {
          condition: { condition: "checkTrait", params: { target: "$self", trait: "Mental", minStars: 3 } },
          then: { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
        }
      }
    ]
  });
  registerCard({
    id: cardId("snelle_drain_reversal"),
    name: "Drain Reversal",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "mp", mp: 15 },
    requirements: [],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
      { primitive: "gainMP", params: { target: "$self", amount: "$pendingEffectDrainAmount" } }
    ]
  });
  registerCard({
    id: cardId("snelle_the_protector"),
    name: "The Protector",
    category: "snelle-piecie",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "reduceMPLossBy", params: { target: "$self", amount: 9999, duration: 2 } }
    ]
  });
  registerCard({
    id: cardId("snelle_gevalletje_klakkeloos"),
    name: "Gevalletje Klakkeloos",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: "$pendingEffectGainAmount" } }
    ]
  });
});

// ── counter-strikka ──────────────────────────────────────────────────────────

describe("counter-strikka", () => {
  it("negates pending effect and costs 15 MP", () => {
    const state = createState({ selfMp: 60, traits: { Mental: 2 } });
    const withPending = pushPendingEffect(state, makePendingLoseMP("e1", "p1", "m1", 30));
    const next = executeCard(withPending, cardId("snelle_counter_strikka"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(45); // 60 - 15 cost
    const negated = next.eventLog.some((e) => e.type === "effect_negated");
    expect(negated).toBe(false); // $pendingEffectId is "" here (not in response mode)
  });

  it("draws a card with Mental ★★★", () => {
    const state = {
      ...createState({ traits: { Mental: 3 }, hand: [] }),
      players: [
        {
          ...createState({ traits: { Mental: 3 } }).players[0],
          deck: [cardId("deck-card-1"), cardId("deck-card-2")]
        }
      ]
    };
    const next = executeCard(state, cardId("snelle_counter_strikka"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].hand.length).toBe(1);
  });

  it("does NOT draw a card with only Mental ★★", () => {
    const state = {
      ...createState({ traits: { Mental: 2 } }),
      players: [
        {
          ...createState({ traits: { Mental: 2 } }).players[0],
          deck: [cardId("deck-card-1")]
        }
      ]
    };
    const next = executeCard(state, cardId("snelle_counter_strikka"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].hand.length).toBe(0);
  });
});

// ── perfect-dodge ─────────────────────────────────────────────────────────────

describe("perfect-dodge", () => {
  it("physical 2 with pending amount >=30 negates effect and grants +15 MP after cost", () => {
    const state = createState({ selfMp: 60, traits: { Physical: 2 } });
    const withPending = pushPendingEffect(state, makePendingLoseMP("e_pd_1", "p1", "m1", 30));
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("snelle_perfect_dodge"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(next.players[0].mosjes[0].mp).toBe(55); // 60 - 20 + 15
    expect(next.eventLog.some((e) => e.type === "effect_negated")).toBe(true);
  });

  it("physical 2 with pending amount <30 does not negate, only grants +15 MP", () => {
    const state = createState({ selfMp: 60, traits: { Physical: 2 } });
    const withPending = pushPendingEffect(state, makePendingLoseMP("e_pd_2", "p1", "m1", 20));
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("snelle_perfect_dodge"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(next.players[0].mosjes[0].mp).toBe(35); // 60 -20 cost +15 gain -20 pending lose
    expect(next.eventLog.some((e) => e.type === "effect_negated")).toBe(false);
  });

  it("physical 3 always negates pending effect", () => {
    const state = createState({ selfMp: 60, traits: { Physical: 3 } });
    const withPending = pushPendingEffect(state, makePendingLoseMP("e_pd_3", "p1", "m1", 10));
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("snelle_perfect_dodge"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(next.players[0].mosjes[0].mp).toBe(55); // 60 -20 +15
    expect(next.eventLog.some((e) => e.type === "effect_negated")).toBe(true);
  });
});

// ── jammertje-gepakt ──────────────────────────────────────────────────────────

describe("jammertje-gepakt", () => {
  it("costs 20 MP, emits card_resolved", () => {
    const state = createState({ selfMp: 60, traits: { Mental: 3 } });
    const next = executeCard(state, cardId("snelle_jammertje_gepakt"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(40); // 60 - 20
    const resolved = next.eventLog.some((e) => e.type === "card_resolved");
    expect(resolved).toBe(true);
  });

  it("draws 1 card with Mental ★★★", () => {
    const state = {
      ...createState({ traits: { Mental: 3 } }),
      players: [
        {
          ...createState({ traits: { Mental: 3 } }).players[0],
          deck: [cardId("d1")]
        }
      ]
    };
    const next = executeCard(state, cardId("snelle_jammertje_gepakt"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].hand.length).toBe(1);
  });
});

// ── drain-reversal ────────────────────────────────────────────────────────────

describe("drain-reversal", () => {
  it("when played as interrupt with pending loseMP(30): negates it and gains 30 MP", () => {
    const state = createState({ selfMp: 60 });
    const pending = makePendingLoseMP("dmg-1", "p1", "m1", 30);
    pending.params = { ...pending.params };

    // Use resolveEffectStack to fire drain-reversal as a non-counter interrupt
    const withPending = pushPendingEffect(state, pending);
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("snelle_drain_reversal"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        respondingToEffectId: "dmg-1",
        respondingToPendingEffect: pending
      }
    });

    // drain-reversal costs 15: 60 - 15 = 45
    // negates loseMP(30), gains 30: 45 + 30 = 75
    expect(next.players[0].mosjes[0].mp).toBe(75);
    expect(next.effectStack.length).toBe(0);
  });
});

// ── the-protector ─────────────────────────────────────────────────────────────

describe("the-protector", () => {
  it("applies full immunity buff (9999 reduction) for 2 turns, free cost", () => {
    const state = createState({ selfMp: 40 });
    const next = executeCard(state, cardId("snelle_the_protector"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const buff = next.players[0].mosjes[0].flags["buff:mp-loss-reduction"] as
      | { data?: { amount?: number } }
      | undefined;
    expect(buff?.data?.amount).toBe(9999);
    expect(next.players[0].mosjes[0].mp).toBe(40); // no cost
  });
});

// ── gevalletje-klakkeloos ─────────────────────────────────────────────────────

describe("gevalletje-klakkeloos", () => {
  it("gains MP equal to pending effect gain amount when played as interrupt", () => {
    const state = createState({ selfMp: 40 });
    const pending = makePendingGainMP("gain-1", "p1", "m1", 25); // opponent gaining 25

    const withPending = pushPendingEffect(state, pending);
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("snelle_gevalletje_klakkeloos"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        respondingToEffectId: "gain-1",
        respondingToPendingEffect: pending
      }
    });

    // Klakkeloos free, gains 25 from $pendingEffectGainAmount, then pending gainMP(25) also fires
    expect(next.players[0].mosjes[0].mp).toBe(90); // 40 + 25 (klakkeloos) + 25 (original pending)
  });
});


