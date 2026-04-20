/**
 * Phase 5 — Step 5: Timing Integration Tests
 *
 * Five end-to-end timing scenarios covering:
 *   A  drain-reversal interrupt
 *   B  Jensen→Frenssen→Blensen full counter-chain
 *   C  not-today blocks sendToWelloe elimination
 *   D  untargetable buff (laat-me-chillen) blocks te-hard-gaan
 *   E  ChainDepthExceededError on 4th canCounter card
 */
import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import {
  pushPendingEffect,
  resolveEffectStack,
  ChainDepthExceededError
} from "../../src/engine/resolve-effect-stack.js";
import {
  UntargetableError,
  resolveTargetReference
} from "../../src/cards/executor/resolve-target-reference.js";

// ── Snelle cards ─────────────────────────────────────────────────────────────
import { DRAIN_REVERSAL } from "../../src/cards/snelle-piecies/drain-reversal.js";
import { JENSEN } from "../../src/cards/snelle-piecies/jensen.js";
import { FRENSSEN } from "../../src/cards/snelle-piecies/frenssen.js";
import { BLENSEN } from "../../src/cards/snelle-piecies/blensen.js";
import { NOT_TODAY } from "../../src/cards/snelle-piecies/not-today.js";

// ── Regular piecies used in Scenario D ───────────────────────────────────────
import { LAAT_ME_CHILLEN } from "../../src/cards/piecies/conditional/laat-me-chillen.js";
import { TE_HARD_GAAN } from "../../src/cards/piecies/attack/te-hard-gaan.js";

import type { GameState } from "../../src/types/game-state.js";
import type { PendingEffect } from "../../src/types/pending-effect.js";
import type { CardId } from "../../src/types/card-id.js";

function cid(s: string): CardId {
  return s as CardId;
}

function makeLoseMP(
  id: string,
  targetPlayerId: string,
  targetInstanceId: string,
  amount: number
): PendingEffect {
  return {
    id,
    source: { kind: "card", cardId: cid("test-source") },
    primitive: "loseMP",
    params: { target: { playerId: targetPlayerId, instanceId: targetInstanceId }, amount },
    canBeCountered: true
  };
}

function makeSendToWelloe(
  id: string,
  targetPlayerId: string,
  targetInstanceId: string
): PendingEffect {
  return {
    id,
    source: { kind: "card", cardId: cid("test-source") },
    primitive: "sendToWelloe",
    params: { target: { playerId: targetPlayerId, instanceId: targetInstanceId } },
    canBeCountered: true
  };
}

function twoPlayerState(p1Mp: number, p2Mp: number): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [{ instanceId: "m1", cardId: cid("c1"), level: 2, mp: p1Mp, flags: {} }],
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
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [{ instanceId: "m2", cardId: cid("c2"), level: 2, mp: p2Mp, flags: {} }],
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

beforeEach(() => {
  clearRegistry();
  registerCard(DRAIN_REVERSAL);
  registerCard(JENSEN);
  registerCard(FRENSSEN);
  registerCard(BLENSEN);
  registerCard(NOT_TODAY);
  registerCard(LAAT_ME_CHILLEN);
  registerCard(TE_HARD_GAAN);
});

// ── Scenario A — drain-reversal interrupt ─────────────────────────────────────

describe("Scenario A — drain-reversal interrupt", () => {
  it("negates the pending loseMP and grants P2 the drain amount", () => {
    // P1 has 80 MP; a pending loseMP(20) targets P1
    // P2 (60 MP) plays drain-reversal (cost 15) as snelle response
    // Expected: P1 keeps 80 MP (drain negated); P2 MP = 60 - 15 + 20 = 65
    const base = twoPlayerState(80, 60);
    const pending = makeLoseMP("e1", "p1", "m1", 20);
    const withPending = pushPendingEffect(base, pending);

    const result = resolveEffectStack(withPending, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_drain_reversal"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
        // drain-reversal targets self_active_mosje — no explicit targetRef needed
      }
    });

    expect(result.effectStack).toHaveLength(0);
    expect(result.players[0].mosjes[0].mp).toBe(80); // P1 unchanged — drain negated
    expect(result.players[1].mosjes[0].mp).toBe(65); // P2: 60 - 15 cost + 20 drained
    expect(result.eventLog.some((e) => e.type === "effect_negated")).toBe(true);
  });

  it("drain-reversal with no pending effect fizzles when requiresStackTarget and stack empty", () => {
    const base = twoPlayerState(80, 60);
    const result = resolveEffectStack(base, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_drain_reversal"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" }
      }
    });
    // fizzles — warning event logged, no cost paid
    expect(result.players[1].mosjes[0].mp).toBe(60);
    expect(result.eventLog.some((e) => e.type === "warning")).toBe(true);
  });
});

// ── Scenario B — Jensen→Frenssen→Blensen full chain ─────────────────────────

describe("Scenario B — Jensen→Frenssen→Blensen counter chain", () => {
  it("builds a 3-layer stack and resolves correctly", () => {
    // Initial: push loseMP e1 targeting P1 (amount 20)
    // P2 plays Frenssen (cost 15): counters e1, deals 10 to P1 → pushed (canCounter=true)
    // P1 plays Blensen (cost 50): counters Frenssen, applies immunity buff → pushed (canCounter=true)
    // resolveEffectStack(null):
    //   - Blensen (top): negates Frenssen, applies buff to P1
    //   - Frenssen: negated by Blensen → does NOT execute
    //   - e1: resolves → loseMP 20 for P1
    // Final P1 mp: 120 - 50(blensen) - 20(e1) = 50
    // Final P2 mp: 80 - 15(frenssen) = 65
    const base = twoPlayerState(120, 80);
    const e1 = makeLoseMP("e1", "p1", "m1", 20);
    let current = pushPendingEffect(base, e1);

    // P2 plays Frenssen (canCounter=true) as response to e1
    current = resolveEffectStack(current, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" },
        targetRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(current.effectStack).toHaveLength(2);
    expect(current.players[1].mosjes[0].mp).toBe(65); // cost paid

    // P1 plays Blensen (canCounter=true) as response to Frenssen
    current = resolveEffectStack(current, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_blensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(current.effectStack).toHaveLength(3);
    expect(current.players[0].mosjes[0].mp).toBe(70); // 120 - 50 blensen cost

    // Fully resolve the stack
    const resolved = resolveEffectStack(current, null);

    expect(resolved.effectStack).toHaveLength(0);
    expect(resolved.players[0].mosjes[0].mp).toBe(50); // 70 - 20 from e1
    expect(resolved.players[1].mosjes[0].mp).toBe(65); // frenssen was negated, no damage dealt
    // Blensen negated Frenssen
    expect(resolved.eventLog.some((e) => e.type === "effect_negated")).toBe(true);
    // Blensen's immunity buff applied to P1's mosje
    expect(resolved.players[0].mosjes[0].flags["buff:effects_ignored_this_turn"]).toBeDefined();
  });
});

// ── Scenario C — not-today blocks sendToWelloe (elimination) ─────────────────

describe("Scenario C — not-today blocks sendToWelloe", () => {
  it("negates a pending sendToWelloe before it executes", () => {
    // P1 has 45 MP; pending sendToWelloe targeting P1.m1 is on the stack
    // P1 plays not-today (cost 20) → negates the sendToWelloe
    // Expected: P1's mosje NOT in welloePile; P1 mp = 45 - 20 = 25
    const base = twoPlayerState(45, 80);
    const pending = makeSendToWelloe("e_elimination", "p1", "m1");
    const withPending = pushPendingEffect(base, pending);

    const result = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_negate_elimination"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });

    expect(result.effectStack).toHaveLength(0);
    // Mosje still alive (not in welloePile)
    expect(result.players[0].welloePile).toHaveLength(0);
    expect(result.players[0].mosjes[0].instanceId).toBe("m1");
    // Cost paid
    expect(result.players[0].mosjes[0].mp).toBe(25);
    // negated event logged
    expect(result.eventLog.some((e) => e.type === "effect_negated")).toBe(true);
  });

  it("not-today with insufficient MP is rejected (cost not paid)", () => {
    // P1 has only 10 MP — cannot pay the 20 MP cost for not-today
    const base = twoPlayerState(10, 80);
    const pending = makeSendToWelloe("e_elim", "p1", "m1");
    const withPending = pushPendingEffect(base, pending);

    const result = resolveEffectStack(withPending, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_negate_elimination"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });

    // Rejected — sendToWelloe was NOT negated; stack resolved with sendToWelloe executing
    expect(result.players[0].mosjes[0].mp).toBe(10); // no cost deducted
    const rejectedEvents = result.eventLog.filter(
      (e) => e.type === "card_resolved" && (e as { outcome?: string }).outcome === "rejected"
    );
    expect(rejectedEvents).toHaveLength(1);
  });
});

// ── Scenario D — untargetable buff blocks te-hard-gaan ───────────────────────

describe("Scenario D — untargetable buff prevents opponent targeting", () => {
  it("laat-me-chillen grants untargetable buff that blocks te-hard-gaan", () => {
    // P1 plays laat-me-chillen (cost 10): +20 MP, gains buff:untargetable for this turn
    // P2 attempts te-hard-gaan (cost 15) targeting P1 → rejected (UntargetableError)
    // P2's MP must remain unchanged (cost NOT paid)
    const base = twoPlayerState(60, 40);

    // P1 plays laat-me-chillen
    const afterChillen = executeCard(base, cid("laat-me-chillen"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });

    // P1: 60 - 10 (cost) + 20 (gain) = 70
    expect(afterChillen.players[0].mosjes[0].mp).toBe(70);
    expect(afterChillen.players[0].mosjes[0].flags["buff:untargetable"]).toBeDefined();

    // P2 attempts te-hard-gaan targeting P1 (who is now untargetable)
    const afterTHG = executeCard(afterChillen, cid("te-hard-gaan"), {
      actingPlayerId: "p2",
      actingMosjeRef: { playerId: "p2", instanceId: "m2" },
      targetRef: { playerId: "p1", instanceId: "m1" }
    });

    // Rejected at validation step — P2 cost NOT paid
    expect(afterTHG.players[1].mosjes[0].mp).toBe(40); // P2 mp unchanged
    // P1 MP also unchanged from afterChillen (loseMP never applied)
    expect(afterTHG.players[0].mosjes[0].mp).toBe(70);
    const rejectedEvent = afterTHG.eventLog.find(
      (e) => e.type === "card_resolved" && (e as { outcome?: string }).outcome === "rejected"
    );
    expect(rejectedEvent).toBeDefined();
  });

  it("resolveTargetReference throws UntargetableError for untargetable target", () => {
    const state = twoPlayerState(60, 40);
    // Give P1's mosje the untargetable buff (active for turn 5)
    const stateWithBuff = {
      ...state,
      players: state.players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) => ({
                ...m,
                flags: { "buff:untargetable": { locked: true, expiryTurn: 5 } }
              }))
            }
      )
    };

    expect(() =>
      resolveTargetReference(stateWithBuff, "opponent_active_mosje", {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" },
        targetRef: { playerId: "p1", instanceId: "m1" }
      })
    ).toThrow(UntargetableError);
  });

  it("expired untargetable buff does NOT block targeting", () => {
    // expiryTurn = 4, currentTurn = 5 → buff expired → targeting succeeds
    const base = twoPlayerState(60, 40);
    const stateWithExpiredBuff = {
      ...base,
      players: base.players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) => ({
                ...m,
                flags: { "buff:untargetable": { locked: true, expiryTurn: 4 } }
              }))
            }
      )
    };

    // te-hard-gaan should resolve normally (loseMP 25 applied)
    const result = executeCard(stateWithExpiredBuff, cid("te-hard-gaan"), {
      actingPlayerId: "p2",
      actingMosjeRef: { playerId: "p2", instanceId: "m2" },
      targetRef: { playerId: "p1", instanceId: "m1" }
    });

    expect(result.players[0].mosjes[0].mp).toBe(35); // 60 - 25
    expect(result.players[1].mosjes[0].mp).toBe(25); // 40 - 15 cost
  });
});

// ── Scenario E — chain depth exceeded ────────────────────────────────────────

describe("Scenario E — chain depth exceeded on 4th canCounter card", () => {
  it("throws ChainDepthExceededError when adding a 4th canCounter to a depth-3 stack", () => {
    // Stack after 3 canBeCountered items:
    //   [e1 (canBeCountered), frenssen_pending (canBeCountered), blensen_pending (canBeCountered)]
    // Trying to add a 4th must throw ChainDepthExceededError
    const base = twoPlayerState(120, 80);
    const e1 = makeLoseMP("e1", "p1", "m1", 20);
    let current = pushPendingEffect(base, e1);

    // P2 plays Frenssen → stack depth 2
    current = resolveEffectStack(current, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" },
        targetRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(current.effectStack).toHaveLength(2);

    // P1 plays Blensen → stack depth 3
    current = resolveEffectStack(current, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_blensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    expect(current.effectStack).toHaveLength(3);

    // P2 attempts another Frenssen (4th canCounter) → must throw
    expect(() =>
      resolveEffectStack(current, {
        respondingPlayerId: "p2",
        snelleCardId: cid("snelle_frenssen"),
        invocation: {
          actingPlayerId: "p2",
          actingMosjeRef: { playerId: "p2", instanceId: "m2" },
          targetRef: { playerId: "p1", instanceId: "m1" }
        }
      })
    ).toThrow(ChainDepthExceededError);
  });

  it("ChainDepthExceededError message is descriptive", () => {
    const base = twoPlayerState(120, 80);
    const e1 = makeLoseMP("e1", "p1", "m1", 20);
    let current = pushPendingEffect(base, e1);
    current = resolveEffectStack(current, {
      respondingPlayerId: "p2",
      snelleCardId: cid("snelle_frenssen"),
      invocation: {
        actingPlayerId: "p2",
        actingMosjeRef: { playerId: "p2", instanceId: "m2" },
        targetRef: { playerId: "p1", instanceId: "m1" }
      }
    });
    current = resolveEffectStack(current, {
      respondingPlayerId: "p1",
      snelleCardId: cid("snelle_blensen"),
      invocation: {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" }
      }
    });

    expect(() =>
      resolveEffectStack(current, {
        respondingPlayerId: "p2",
        snelleCardId: cid("snelle_frenssen"),
        invocation: {
          actingPlayerId: "p2",
          actingMosjeRef: { playerId: "p2", instanceId: "m2" },
          targetRef: { playerId: "p1", instanceId: "m1" }
        }
      })
    ).toThrow("max 3 counter-cards");
  });
});
