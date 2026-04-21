import { beforeEach, describe, expect, it } from "vitest";
import {
  resolveEffectStack,
  pushPendingEffect,
  SnelleOnlyError,
  ChainDepthExceededError
} from "../../src/engine/resolve-effect-stack.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";
import type { PendingEffect } from "../../src/types/pending-effect.js";

function cardId(value: string): CardId {
  return value as CardId;
}

// ── minimal snelle card registrations ────────────────────────────────────────

const JENSEN = {
  id: cardId("jensen"),
  name: "Jensen!",
  category: "snelle-piecie" as const,
  isBoosterOnly: false,
  cost: { type: "free" as const },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "instant" as const,
  duration: "instant" as const,
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
};

const FRENSSEN = {
  id: cardId("frenssen"),
  name: "Frenssen!",
  category: "snelle-piecie" as const,
  isBoosterOnly: false,
  canCounter: true,
  requiresStackTarget: true,
  cost: { type: "free" as const },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "instant" as const,
  duration: "instant" as const,
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    { primitive: "gainMP", params: { target: "$self", amount: 20 } }
  ]
};

const BLENSEN = {
  id: cardId("blensen"),
  name: "Blensen!",
  category: "snelle-piecie" as const,
  isBoosterOnly: false,
  canCounter: true,
  cost: { type: "mp" as const, mp: 50 },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "instant" as const,
  duration: "instant" as const,
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "chain_immune_this_turn",
        data: { immune: true },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

const NON_SNELLE = {
  id: cardId("regular-piecie"),
  name: "Regular",
  category: "piecie" as const,
  isBoosterOnly: false,
  cost: { type: "free" as const },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "on_play" as const,
  duration: "instant" as const,
  effects: []
};

// ── state helpers ─────────────────────────────────────────────────────────────

function createState(overrides: { selfMp?: number; oppMp?: number } = {}): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [{ instanceId: "m1", cardId: cardId("c1"), level: 2, mp: overrides.selfMp ?? 60, flags: {} }],
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
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [{ instanceId: "m2", cardId: cardId("c2"), level: 2, mp: overrides.oppMp ?? 60, flags: {} }],
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

function makePendingGainMP(id: string, playerId: string, instanceId: string, amount: number): PendingEffect {
  return {
    id,
    source: { kind: "card", cardId: cardId("external") },
    primitive: "gainMP",
    params: { target: { playerId, instanceId }, amount },
    canBeCountered: false
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard(JENSEN);
  registerCard(FRENSSEN);
  registerCard(BLENSEN);
  registerCard(NON_SNELLE);
});

// ─── Basic resolution ─────────────────────────────────────────────────────────

describe("resolveEffectStack basics", () => {
  it("empty stack: no-op", () => {
    const state = createState();
    const next = resolveEffectStack(state, null);
    expect(next.effectStack.length).toBe(0);
    expect(next.players[0].mosjes[0].mp).toBe(60);
  });

  it("single pending effect: resolves normally", () => {
    const state = createState();
    const withEffect = pushPendingEffect(state, makePendingGainMP("e1", "p1", "m1", 15));
    const next = resolveEffectStack(withEffect, null);
    expect(next.effectStack.length).toBe(0);
    expect(next.players[0].mosjes[0].mp).toBe(75); // 60 + 15
  });
});

// ─── Snelle interrupt (non-counter) ──────────────────────────────────────────

describe("snelle interrupt — non-counter", () => {
  it("snelle fires before pending effect when played as response", () => {
    const state = createState({ selfMp: 60, oppMp: 60 });
    // Push a pending gainMP for p2
    const withPending = pushPendingEffect(state, makePendingGainMP("e1", "p2", "m2", 30));

    // p1 plays jensen as snelle interrupt (non-counter)
    const next = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("jensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });

    // Jensen fires for p1: +20 MP. Then pending gainMP fires for p2: +30
    expect(next.players[0].mosjes[0].mp).toBe(80); // 60 + 20
    expect(next.players[1].mosjes[0].mp).toBe(90); // 60 + 30
    expect(next.effectStack.length).toBe(0);
  });

  it("non-snelle played as response throws SnelleOnlyError", () => {
    const state = createState();
    const withPending = pushPendingEffect(state, makePendingGainMP("e1", "p1", "m1", 10));
    expect(() =>
      resolveEffectStack(withPending, {
        respondingPlayerId: "p1",
        snelleCardId: cardId("regular-piecie"),
        invocation: {
          actingPlayerId: "p1",
          actingMosjeRef: { playerId: "p1", instanceId: "m1" }
        }
      })
    ).toThrow(SnelleOnlyError);
  });
});

// ─── Frenssen / Blensen chain ─────────────────────────────────────────────────

describe("frenssen / blensen chain", () => {
  it("frenssen with empty stack fizzles — warning event, state unchanged, no MP gained", () => {
    const state = createState({ selfMp: 60 });
    const next = resolveEffectStack(state, {
      respondingPlayerId: "p2",
      snelleCardId: cardId("frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
      }
    });
    expect(next.effectStack.length).toBe(0);
    expect(next.players[1].mosjes[0].mp).toBe(60); // unchanged
    const hasWarn = next.eventLog.some((e) => e.type === "warning" && e.code === "snelle_fizzle");
    expect(hasWarn).toBe(true);
  });

  it("blensen with empty stack applies immunity (standalone play)", () => {
    const state = createState({ selfMp: 80 });
    // Push blensen as counter (canCounter:true) — but with empty stack no requiresStackTarget check
    const pushed = resolveEffectStack(state, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("blensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    // Blensen pushed to stack (canCounter=true, no requiresStackTarget)
    expect(pushed.effectStack.length).toBe(1);
    // Resolve the stack
    const next = resolveEffectStack(pushed, null);
    expect(next.effectStack.length).toBe(0);
    // 80 - 50 (cost not paid during push, handled at resolve... actually cost isn't paid here)
    // Note: snelle cost is not paid on push in this implementation (deferred design)
    // The buff should be applied:
    const buff = next.players[0].mosjes[0].flags["buff:chain_immune_this_turn"];
    expect(buff).toBeDefined();
  });

  it("frenssen with Jensen on stack: negates Jensen + gains +20 MP", () => {
    const state = createState({ selfMp: 60 });

    // Push Jensen as a pending gainMP effect for p2
    const jensenPending: PendingEffect = {
      id: "jensen-effect-1",
      source: { kind: "card", cardId: cardId("jensen") },
      primitive: "gainMP",
      params: { target: { playerId: "p2", instanceId: "m2" }, amount: 20 },
      canBeCountered: true
    };
    const withJensen = pushPendingEffect(state, jensenPending);

    // p2 plays Frenssen as counter response
    const withFrenssen = resolveEffectStack(withJensen, {
      respondingPlayerId: "p2",
      snelleCardId: cardId("frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
      }
    });
    // Frenssen pushed to stack, stack: [Jensen, Frenssen]
    expect(withFrenssen.effectStack.length).toBe(2);

    // Resolve: Frenssen pops first, negates Jensen, gains +20; then Jensen would fire but it's negated
    const next = resolveEffectStack(withFrenssen, null);
    expect(next.effectStack.length).toBe(0);
    // Jensen was negated, so p2 did NOT gain its +20 from the original effect
    // Frenssen DID gain +20 for p2
    expect(next.players[1].mosjes[0].mp).toBe(80); // 60 + 20 from Frenssen
    const negated = next.eventLog.some((e) => e.type === "effect_negated");
    expect(negated).toBe(true);
  });

  it("Jensen → Frenssen → Blensen: Blensen resolves first, Frenssen negated, Jensen resolves", () => {
    const state = createState({ selfMp: 80, oppMp: 60 });

    // Push Jensen as a pending effect for p2 (would gain p2 +20)
    const jensenPending: PendingEffect = {
      id: "jensen-effect-1",
      source: { kind: "card", cardId: cardId("jensen") },
      primitive: "gainMP",
      params: { target: { playerId: "p2", instanceId: "m2" }, amount: 20 },
      canBeCountered: true
    };
    let current = pushPendingEffect(state, jensenPending);

    // Opponent (p2) pushes Frenssen as counter to Jensen
    current = resolveEffectStack(current, {
      respondingPlayerId: "p2",
      snelleCardId: cardId("frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
      }
    });
    expect(current.effectStack.length).toBe(2); // [Jensen, Frenssen]

    // p1 pushes Blensen as counter to Frenssen
    current = resolveEffectStack(current, {
      respondingPlayerId: "p1",
      snelleCardId: cardId("blensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(current.effectStack.length).toBe(3); // [Jensen, Frenssen, Blensen]

    // Resolve all
    const next = resolveEffectStack(current, null);
    expect(next.effectStack.length).toBe(0);

    // Blensen resolved: negated Frenssen + applied immunity to p1
    const p1Immunity = next.players[0].mosjes[0].flags["buff:chain_immune_this_turn"];
    expect(p1Immunity).toBeDefined();

    // Frenssen was negated — so p2 did NOT gain Frenssen's +20
    // Jensen still resolves (wasn't negated by Blensen): p2 gains +20 from original Jensen effect
    // But wait: Frenssen (when it resolves) would have negated Jensen — but Frenssen itself was negated by Blensen
    // So Jensen DOES resolve: p2 gains +20
    expect(next.players[1].mosjes[0].mp).toBe(80); // 60 + 20 from Jensen
    // p2 did NOT gain Frenssen's bonus +20 (Frenssen was negated)
    // So p2 total = 60 + 20 = 80

    const negateEvents = next.eventLog.filter((e) => e.type === "effect_negated");
    expect(negateEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("chain depth > 3 throws ChainDepthExceededError", () => {
    const state = createState();

    // Push 3 canBeCountered items to stack
    const e1: PendingEffect = { id: "e1", source: { kind: "card" }, primitive: "__snelle__", params: {}, canBeCountered: true };
    const e2: PendingEffect = { id: "e2", source: { kind: "card" }, primitive: "__snelle__", params: {}, canBeCountered: true };
    const e3: PendingEffect = { id: "e3", source: { kind: "card" }, primitive: "__snelle__", params: {}, canBeCountered: true };
    let withStack = pushPendingEffect(state, e1);
    withStack = pushPendingEffect(withStack, e2);
    withStack = pushPendingEffect(withStack, e3);

    expect(() =>
      resolveEffectStack(withStack, {
        respondingPlayerId: "p1",
        snelleCardId: cardId("frenssen"),
        invocation: {
          actingPlayerId: "p1",
          actingMosjeRef: { playerId: "p1", instanceId: "m1" }
        }
      })
    ).toThrow(ChainDepthExceededError);
  });
});
