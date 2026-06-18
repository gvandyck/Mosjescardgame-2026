import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error - JS module, no type declarations
import { checkVictory, applyPendingDefeats } from "../../src/engine/victoryChecker.js";

/**
 * Phase 30 — Defeat at 0 MP.
 * A Mosje reduced BELOW 0 by a damaging effect while at Level 0 is defeated
 * (sent to graveyard/Welloe). It never holds negative MP. Level>0 regresses.
 * Summoned/placed-at-0 Mosjes survive. Ruling phase0-rulings.md:118.
 */

function makeSlot(cardId: string, mp: number, level = 0) {
  return {
    cardId,
    name: cardId,
    mp,
    level,
    isDefeated: false,
    traits: {},
    statusEffects: [] as any[],
    abilityUsedThisTurn: false,
  };
}

function makeState(p1mp: number, p1level: number, p2mp: number, p2level: number) {
  return {
    status: "ACTIVE",
    activePlayerId: "player_1",
    turnNumber: 3,
    players: {
      player_1: {
        name: "P1",
        hand: [], deck: [], graveyard: [],
        activeSlots: [makeSlot("mosje_a", p1mp, p1level), null],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        name: "P2",
        hand: [], deck: [], graveyard: [],
        activeSlots: [makeSlot("mosje_b", p2mp, p2level), null],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe("Defeat at 0 MP (Phase 30)", () => {
  it("Lv0 Mosje reduced below 0 by damage → flagged then defeated to graveyard", () => {
    let state = makeState(10, 0, 50, 1);
    // Deal 25 damage to player_1's Lv0 Mosje (10 MP) → would be -15
    state = loseMP(state, "player_1", 0, 25, "DRAIN");
    // loseMP itself never holds negative MP and flags the slot
    expect(state.players.player_1.activeSlots[0].mp).toBe(0);
    expect(state.players.player_1.activeSlots[0]._pendingDefeat).toBe(true);

    // checkVictory runs the sweep
    state = checkVictory(state);
    // Mosje removed from field and present in graveyard
    expect(state.players.player_1.activeSlots[0]).toBeNull();
    const gy = state.players.player_1.graveyard.map((c: any) => c.cardId ?? c);
    expect(gy).toContain("mosje_a");
  });

  it("KNOCKOUT fires when the last Mosje is defeated", () => {
    let state = makeState(5, 0, 80, 2);
    state = loseMP(state, "player_1", 0, 20, "ABILITY"); // -15 → defeat
    state = checkVictory(state);
    expect(state.status).toBe("FINISHED");
    expect(state.winnerId).toBe("player_2");
    expect(state.winReason).toBe("KNOCKOUT");
  });

  it("Lv1 Mosje reduced below 0 regresses to Lv0 and is NOT defeated", () => {
    let state = makeState(20, 1, 50, 1);
    // 50 damage to a Lv1/20MP Mosje → overflow 30 → Lv0, mp = 100-30 = 70
    state = loseMP(state, "player_1", 0, 50, "DRAIN");
    const slot = state.players.player_1.activeSlots[0];
    expect(slot).not.toBeNull();
    expect(slot.level).toBe(0);
    expect(slot.mp).toBe(70);
    expect(slot._pendingDefeat).toBeUndefined();
    state = checkVictory(state);
    expect(state.players.player_1.activeSlots[0]).not.toBeNull(); // survived
  });

  it("Mosje summoned/placed at 0 MP survives (no reduction path → no flag)", () => {
    // A Mosje sitting at 0 MP that was never reduced below 0 must NOT be defeated.
    let state = makeState(0, 0, 50, 1);
    state = checkVictory(state);
    expect(state.players.player_1.activeSlots[0]).not.toBeNull();
    expect(state.players.player_1.activeSlots[0].mp).toBe(0);
    expect(state.status).not.toBe("FINISHED");
  });

  it("Mosje at exactly 0 MP that takes further damage IS defeated", () => {
    let state = makeState(0, 0, 50, 1);
    // 5 more damage → -5 → below 0 at Lv0 → defeat
    state = loseMP(state, "player_1", 0, 5, "DRAIN");
    expect(state.players.player_1.activeSlots[0]._pendingDefeat).toBe(true);
    state = checkVictory(state);
    expect(state.players.player_1.activeSlots[0]).toBeNull();
  });

  it("WELLOE_SHIELD saves a flagged Mosje (restored to 5 MP, stays on field)", () => {
    let state = makeState(10, 0, 50, 1);
    state.players.player_1.activeSlots[0].statusEffects.push({ type: "WELLOE_SHIELD", turnsLeft: 1 });
    state = loseMP(state, "player_1", 0, 30, "DRAIN"); // flagged
    state = checkVictory(state);
    const slot = state.players.player_1.activeSlots[0];
    expect(slot).not.toBeNull();           // shield saved it
    expect(slot.mp).toBe(5);               // restored to 5 MP (game rule: 5-grid)
    expect(slot._pendingDefeat).toBeUndefined(); // flag cleared (no infinite loop)
    expect(state.status).not.toBe("FINISHED");
  });

  it("exactly-0 result (damage == MP) does NOT defeat (not below 0)", () => {
    let state = makeState(10, 0, 50, 1);
    state = loseMP(state, "player_1", 0, 10, "DRAIN"); // exactly 0
    expect(state.players.player_1.activeSlots[0].mp).toBe(0);
    expect(state.players.player_1.activeSlots[0]._pendingDefeat).toBeUndefined();
    state = checkVictory(state);
    expect(state.players.player_1.activeSlots[0]).not.toBeNull();
  });

  it("applyPendingDefeats is a no-op when nothing is flagged", () => {
    const state = makeState(30, 1, 40, 1);
    const out = applyPendingDefeats(state);
    expect(out.players.player_1.activeSlots[0]).not.toBeNull();
    expect(out.players.player_2.activeSlots[0]).not.toBeNull();
  });
});
