import { describe, expect, it } from "vitest";
import { checkMP } from "../../src/effects/conditions/check-mp.js";
import { checkCardTypeInPlay } from "../../src/effects/conditions/check-card-type-in-play.js";
import { checkEventLogThisTurn } from "../../src/effects/conditions/check-event-log-this-turn.js";
import { checkPendingEffectAmount } from "../../src/effects/conditions/check-pending-effect-amount.js";
import type { GameState } from "../../src/types/game-state.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { PendingEffect } from "../../src/types/pending-effect.js";
import type { CardId } from "../../src/types/card-id.js";
import { createRng } from "../../src/utils/rng.js";

function cid(s: string): CardId {
  return s as CardId;
}

function baseState(): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [{ instanceId: "m1", cardId: cid("mosje_a"), level: 1, mp: 50, flags: {} }],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({
          slotIndex,
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
    rngSeed: 1,
    lastRoll: null
  };
}

function ctx(state: GameState, actingPlayerId = "p1"): EffectContext {
  return {
    source: { kind: "card", cardId: cid("x"), playerId: actingPlayerId },
    actingPlayerId,
    rng: createRng(state.rngSeed),
    turnCount: state.turnCount
  };
}

// Build a state where "this turn" events include the provided events,
// preceded by a turn_started sentinel so eventsSince picks them up.
function stateWithTurnEvents(events: Array<Record<string, unknown>>): GameState {
  return {
    ...baseState(),
    currentTurnStartCount: 5,
    eventLog: [
      { type: "turn_started", turn: 5, playerId: "p1" },
      ...events
    ] as GameState["eventLog"]
  };
}

// ─── checkMP ─────────────────────────────────────────────────────────────────

describe("checkMP – uncovered branches", () => {
  it("returns false when the target instanceId does not exist", () => {
    const state = baseState();
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "UNKNOWN" }, operator: ">=", value: 10 })
    ).toBe(false);
  });

  it("returns false when the target playerId does not exist", () => {
    const state = baseState();
    expect(
      checkMP(state, { target: { playerId: "UNKNOWN_PLAYER", instanceId: "m1" }, operator: ">=", value: 10 })
    ).toBe(false);
  });

  it("between operator: returns true when mp is inside the range", () => {
    const state = baseState(); // m1.mp = 50
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "between", value: 40, rangeEnd: 60 })
    ).toBe(true);
  });

  it("between operator: returns false when mp is outside the range", () => {
    const state = baseState(); // m1.mp = 50
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "between", value: 60, rangeEnd: 80 })
    ).toBe(false);
  });

  it("between operator without rangeEnd treats value as both bounds", () => {
    const state = baseState(); // m1.mp = 50
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "between", value: 50 })
    ).toBe(true);
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "between", value: 51 })
    ).toBe(false);
  });

  it("<= operator: returns true when mp is at or below value", () => {
    const state = baseState(); // m1.mp = 50
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "<=", value: 50 })
    ).toBe(true);
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "<=", value: 49 })
    ).toBe(false);
  });

  it("== operator: returns true only on exact match", () => {
    const state = baseState(); // m1.mp = 50
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "==", value: 50 })
    ).toBe(true);
    expect(
      checkMP(state, { target: { playerId: "p1", instanceId: "m1" }, operator: "==", value: 49 })
    ).toBe(false);
  });
});

// ─── checkCardTypeInPlay ──────────────────────────────────────────────────────

describe("checkCardTypeInPlay – uncovered branches", () => {
  it("returns false when the playerId is unknown", () => {
    const state = baseState();
    expect(checkCardTypeInPlay(state, { playerId: "UNKNOWN_PLAYER", cardType: "mosje" })).toBe(false);
  });
});

// ─── checkPendingEffectAmount ─────────────────────────────────────────────────

describe("checkPendingEffectAmount – uncovered branches", () => {
  function pendingCtx(amount: number): EffectContext {
    const pending: PendingEffect = {
      id: "pe1",
      source: { kind: "card", cardId: cid("x"), playerId: "p2" },
      primitive: "loseMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount },
      canBeCountered: true
    };
    return { ...ctx(baseState()), respondingToPendingEffect: pending };
  }

  it("<= operator: returns true when amount is at or below value", () => {
    expect(checkPendingEffectAmount(baseState(), { operator: "<=", value: 20 }, pendingCtx(20))).toBe(true);
    expect(checkPendingEffectAmount(baseState(), { operator: "<=", value: 20 }, pendingCtx(21))).toBe(false);
  });
});

// ─── checkEventLogThisTurn ────────────────────────────────────────────────────

describe("checkEventLogThisTurn – uncovered branches", () => {
  it("cardIdFilter: returns false when event type matches but event has no cardId field", () => {
    // mp_gained matches eventType "mp_gained" but lacks a cardId property
    const state = stateWithTurnEvents([
      {
        type: "mp_gained",
        target: { playerId: "p1", instanceId: "m1" },
        amount: 10,
        source: { kind: "card" }
      }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", cardIdFilter: ["some_card"] }, ctx(state))
    ).toBe(false);
  });

  it("playerId filter: returns false when event has no playerId field", () => {
    // mp_gained has no playerId field → fails the playerId filter
    const state = stateWithTurnEvents([
      {
        type: "mp_gained",
        target: { playerId: "p1", instanceId: "m1" },
        amount: 10,
        source: { kind: "card" }
      }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", playerId: "p1" }, ctx(state))
    ).toBe(false);
  });

  it("playerId filter: returns false when event playerId does not match the filter", () => {
    const state = stateWithTurnEvents([
      { type: "card_resolved", cardId: cid("c1"), playerId: "p2", outcome: "success" }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", playerId: "p1" }, ctx(state))
    ).toBe(false);
  });

  it("playerId filter: returns true when event playerId matches", () => {
    const state = stateWithTurnEvents([
      { type: "card_resolved", cardId: cid("c1"), playerId: "p1", outcome: "success" }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", playerId: "p1" }, ctx(state))
    ).toBe(true);
  });

  it("targetSelf: returns false when matching event has no target field", () => {
    // card_resolved has no 'target' field
    const state = stateWithTurnEvents([
      { type: "card_resolved", cardId: cid("c1"), playerId: "p1", outcome: "success" }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", targetSelf: true }, ctx(state))
    ).toBe(false);
  });

  it("targetSelf: returns false when target.playerId !== actingPlayerId", () => {
    // mp_gained targets p2, but actingPlayerId is p1
    const state = stateWithTurnEvents([
      {
        type: "mp_gained",
        target: { playerId: "p2", instanceId: "m3" },
        amount: 10,
        source: { kind: "card" }
      }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", targetSelf: true }, ctx(state, "p1"))
    ).toBe(false);
  });

  it("targetSelf: returns true when target.playerId === actingPlayerId", () => {
    const state = stateWithTurnEvents([
      {
        type: "mp_gained",
        target: { playerId: "p1", instanceId: "m1" },
        amount: 10,
        source: { kind: "card" }
      }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", targetSelf: true }, ctx(state, "p1"))
    ).toBe(true);
  });

  it("minAmount: returns false when matching events have no amount field (sum stays 0)", () => {
    // card_resolved has no 'amount' field → reduce skips it → total 0 < 5
    const state = stateWithTurnEvents([
      { type: "card_resolved", cardId: cid("c1"), playerId: "p1", outcome: "success" }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "card_resolved", minAmount: 5 }, ctx(state))
    ).toBe(false);
  });

  it("minAmount: sums amount fields when present", () => {
    const state = stateWithTurnEvents([
      { type: "mp_gained", target: { playerId: "p1", instanceId: "m1" }, amount: 10, source: { kind: "card" } },
      { type: "mp_gained", target: { playerId: "p1", instanceId: "m1" }, amount: 5, source: { kind: "card" } }
    ]);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", minAmount: 15 }, ctx(state))
    ).toBe(true);
    expect(
      checkEventLogThisTurn(state, { eventType: "mp_gained", minAmount: 16 }, ctx(state))
    ).toBe(false);
  });
});
