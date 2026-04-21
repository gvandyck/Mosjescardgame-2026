import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { resolvePrimitive } from "../../src/effects/registry.js";
import { resolveEffectStack, pushPendingEffect } from "../../src/engine/resolve-effect-stack.js";
import { checkPendingEffectAmount } from "../../src/effects/conditions/check-pending-effect-amount.js";
import { checkEventLogThisTurn } from "../../src/effects/conditions/check-event-log-this-turn.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardId } from "../../src/types/card-id.js";
import type { PendingEffect } from "../../src/types/pending-effect.js";
import { createRng } from "../../src/utils/rng.js";

function cid(v: string): CardId {
  return v as CardId;
}

function twoPlayerState(p1Mp = 80, p2Mp = 80): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [{ instanceId: "m1", cardId: cid("c1"), level: 2, mp: p1Mp, flags: {} }],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({ slotIndex, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [{ instanceId: "m2", cardId: cid("c2"), level: 2, mp: p2Mp, flags: {} }],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({ slotIndex, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 123,
    lastRoll: null,
    currentTurnStartCount: 5
  };
}

function context(state: GameState) {
  return {
    source: { kind: "card" as const, cardId: cid("ctx-card"), playerId: "p1" },
    actingPlayerId: "p1",
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard({
    id: cid("snelle_blensen"),
    name: "Blensen!",
    category: "snelle-piecie",
    canCounter: true,
    isBoosterOnly: false,
    cost: { type: "variable", resolver: "blensen_cost" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [{ primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }]
  });

  registerCard({
    id: cid("snelle_frenssen"),
    name: "Frenssen!",
    category: "snelle-piecie",
    canCounter: true,
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "mp", mp: 15 },
    requirements: [],
    target: "opponent_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [
      { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
      { primitive: "loseMP", params: { target: "$target", amount: 10, isCostPayment: false } }
    ]
  });

  registerCard({
    id: cid("snelle_jantje_jantje_jantje"),
    name: "Jantje",
    category: "snelle-piecie",
    requiresStackTarget: true,
    isBoosterOnly: false,
    cost: { type: "discard", discardCount: 1 },
    requirements: [{ type: "place_active", params: { placeCardId: "place_bank_chilling" } }],
    target: "self_active_mosje",
    trigger: "instant",
    duration: "instant",
    effects: [{ primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }]
  });

  registerCard({
    id: cid("snelle_perfect_dodge"),
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
});

describe("phase6 step0 infrastructure", () => {
  it("sendToBottomOfDeck moves card to deck last position", () => {
    const primitive = resolvePrimitive("sendToBottomOfDeck");
    const state = {
      ...twoPlayerState(),
      players: twoPlayerState().players.map((p) =>
        p.id !== "p2" ? p : { ...p, hand: [cid("x1")], deck: [cid("a"), cid("b")] }
      )
    };

    const next = primitive(state, { playerId: "p2", cardId: cid("x1") }, context(state));
    expect(next.players[1].hand).not.toContain(cid("x1"));
    expect(next.players[1].deck[next.players[1].deck.length - 1]).toBe(cid("x1"));
    expect(next.eventLog.some((e) => e.type === "card_sent_to_deck_bottom")).toBe(true);
  });

  it("discardSourceCard moves source card from source player's hand to discard", () => {
    const primitive = resolvePrimitive("discardSourceCard");
    const pending: PendingEffect = {
      id: "e1",
      source: { kind: "card", cardId: cid("src-card"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 },
      canBeCountered: true
    };
    const state = {
      ...twoPlayerState(),
      effectStack: [pending],
      players: twoPlayerState().players.map((p) =>
        p.id !== "p2" ? p : { ...p, hand: [cid("src-card")], discard: [] }
      )
    };

    const next = primitive(state, { pendingEffectId: "e1" }, context(state));
    expect(next.players[1].hand).not.toContain(cid("src-card"));
    expect(next.players[1].discard).toContain(cid("src-card"));
  });

  it("discard cost in executeCard removes chosen card from hand", () => {
    const state = {
      ...twoPlayerState(60),
      activePlace: { cardId: cid("place_bank_chilling"), ownerId: "p1", turnsActive: 1 },
      players: twoPlayerState(60).players.map((p) => (p.id !== "p1" ? p : { ...p, hand: [cid("d1")] }))
    };

    const next = executeCard(state, cid("snelle_jantje_jantje_jantje"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" },
      playerChoices: { discardCardId: "d1" }
    });

    expect(next.players[0].hand).toHaveLength(0);
    expect(next.players[0].discard).toContain(cid("d1"));
  });

  it("mp_loss_immune prevents loseMP application", () => {
    const loseMP = resolvePrimitive("loseMP");
    const state = {
      ...twoPlayerState(60),
      players: twoPlayerState(60).players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : { ...m, flags: { "buff:mp_loss_immune": { expiryTurn: 10, data: { immune: true } } } }
              )
            }
      )
    };

    const next = loseMP(
      state,
      { target: { playerId: "p1", instanceId: "m1" }, amount: 25, isCostPayment: false },
      context(state)
    );
    expect(next.players[0].mosjes[0].mp).toBe(60);
    expect(next.eventLog.some((e) => e.type === "mp_loss_blocked")).toBe(true);
  });

  it("checkPendingEffectAmount handles >=, < and ==0 correctly", () => {
    const state = twoPlayerState();
    const withPending = {
      ...context(state),
      respondingToPendingEffect: {
        id: "e2",
        source: { kind: "card", cardId: cid("x"), playerId: "p2" },
        primitive: "loseMP",
        params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 },
        canBeCountered: true
      }
    };

    expect(checkPendingEffectAmount(state, { operator: ">=", value: 20 }, withPending)).toBe(true);
    expect(checkPendingEffectAmount(state, { operator: ">", value: 20 }, withPending)).toBe(false);
    expect(checkPendingEffectAmount(state, { operator: "==", value: 0 }, context(state))).toBe(true);
  });

  it("checkEventLogThisTurn sees this turn and ignores previous turn", () => {
    const state: GameState = {
      ...twoPlayerState(),
      eventLog: [
        { type: "turn_started", turn: 4, playerId: "p1" },
        { type: "card_resolved", cardId: cid("snelle_jensen"), playerId: "p1", outcome: "success" },
        { type: "turn_started", turn: 5, playerId: "p2" },
        { type: "card_resolved", cardId: cid("snelle_frenssen"), playerId: "p2", outcome: "success" }
      ],
      currentTurnStartCount: 5
    };

    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", cardIdFilter: ["snelle_frenssen"] }, context(state))
    ).toBe(true);
    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", cardIdFilter: ["snelle_jensen"] }, context(state))
    ).toBe(false);
  });

  it("blensen costs 50 when Jensen/Frenssen not played this turn", () => {
    const pending: PendingEffect = {
      id: "e3",
      source: { kind: "card", cardId: cid("ext"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 },
      canBeCountered: true
    };
    const state = pushPendingEffect(twoPlayerState(80, 80), pending);
    const next = resolveEffectStack(state, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_blensen"),
      invocation: { actingPlayerId: "p1", actingMosjeRef: { playerId: "p1", instanceId: "m1" } }
    });
    expect(next.players[0].mosjes[0].mp).toBe(30);
  });

  it("blensen is free when Jensen/Frenssen was played this turn", () => {
    const pending: PendingEffect = {
      id: "e4",
      source: { kind: "card", cardId: cid("ext"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 },
      canBeCountered: true
    };
    const state: GameState = {
      ...pushPendingEffect(twoPlayerState(80, 80), pending),
      eventLog: [
        { type: "turn_started", turn: 5, playerId: "p1" },
        { type: "card_resolved", cardId: cid("snelle_jensen"), playerId: "p1", outcome: "success" }
      ],
      currentTurnStartCount: 5
    };

    const next = resolveEffectStack(state, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_blensen"),
      invocation: { actingPlayerId: "p1", actingMosjeRef: { playerId: "p1", instanceId: "m1" } }
    });
    expect(next.players[0].mosjes[0].mp).toBe(80);
  });

  it("frenssen auto-resolves targetRef from pending source.playerId", () => {
    const pending: PendingEffect = {
      id: "e5",
      source: { kind: "card", cardId: cid("snelle_jensen"), playerId: "p1" },
      primitive: "loseMP",
      params: { target: { playerId: "p2", instanceId: "m2" }, amount: 20 },
      canBeCountered: true
    };
    const state = pushPendingEffect(twoPlayerState(80, 80), pending);

    const withFrenssen = resolveEffectStack(state, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
      }
    });

    const resolved = resolveEffectStack(withFrenssen, null);
    expect(resolved.players[0].mosjes[0].mp).toBe(70); // got hit by frenssen auto-target
  });

  it("perfect-dodge: physical3 always negates, physical2 negates only at amount>=30", () => {
    const base = {
      ...twoPlayerState(80, 80),
      players: twoPlayerState(80, 80).players.map((p) =>
        p.id !== "p1" ? p : { ...p, mosjes: [{ ...p.mosjes[0], flags: { traits: { Physical: 2 } } }] }
      )
    };

    const high = pushPendingEffect(base, {
      id: "pd-high",
      source: { kind: "card", cardId: cid("ext"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 30 },
      canBeCountered: true
    });
    const highResult = resolveEffectStack(high, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_perfect_dodge"),
      invocation: { actingPlayerId: "p1", actingMosjeRef: { playerId: "p1", instanceId: "m1" } }
    });
    expect(highResult.eventLog.some((e) => e.type === "effect_negated")).toBe(true);

    const low = pushPendingEffect(base, {
      id: "pd-low",
      source: { kind: "card", cardId: cid("ext"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 },
      canBeCountered: true
    });
    const lowResult = resolveEffectStack(low, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_perfect_dodge"),
      invocation: { actingPlayerId: "p1", actingMosjeRef: { playerId: "p1", instanceId: "m1" } }
    });
    expect(lowResult.eventLog.some((e) => e.type === "effect_negated")).toBe(false);
  });
});
