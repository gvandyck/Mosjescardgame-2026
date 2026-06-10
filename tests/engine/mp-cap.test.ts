import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { gainMP } from "../../src/engine/mpManager.js";
// @ts-expect-error - JS module, no type declarations
import { checkVictory, clampMosjeMp } from "../../src/engine/victoryChecker.js";

/**
 * Phase 31 — MP 0–100 cap invariant.
 * MP never exceeds 100. Only Quests permanently level up (gainMP default).
 * Non-quest gains (allowLevelUp:false) cap at 100 and never level.
 */

function makeSlot(cardId: string, mp: number, level = 0) {
  return {
    cardId, name: cardId, subtype: "FIGHTING", traits: {}, mp, level,
    isDefeated: false, statusEffects: [] as any[], abilityUsedThisTurn: false,
  };
}
function makeState(p1mp: number, p1level = 0) {
  return {
    status: "ACTIVE", activePlayerId: "player_1", turnNumber: 3,
    players: {
      player_1: { name: "P1", hand: [], deck: [], graveyard: [], activeSlots: [makeSlot("mosje_a", p1mp, p1level), null], piecieSlots: [null, null, null, null] },
      player_2: { name: "P2", hand: [], deck: [], graveyard: [], activeSlots: [makeSlot("mosje_b", 50, 0), null], piecieSlots: [null, null, null, null] },
    },
  } as any;
}

describe("MP 0–100 cap (Phase 31)", () => {
  it("clampMosjeMp caps an over-100 Mosje at 100", () => {
    const state = makeState(105, 0);
    const out = clampMosjeMp(state);
    expect(out.players.player_1.activeSlots[0].mp).toBe(100);
  });

  it("clampMosjeMp leaves MP <= 100 untouched", () => {
    const state = makeState(100, 0);
    const out = clampMosjeMp(state);
    expect(out.players.player_1.activeSlots[0].mp).toBe(100);
    const state2 = makeState(60, 0);
    expect(clampMosjeMp(state2).players.player_1.activeSlots[0].mp).toBe(60);
  });

  it("checkVictory clamps a Mosje sitting above 100 (sweep)", () => {
    let state = makeState(130, 0);
    state = checkVictory(state);
    expect(state.players.player_1.activeSlots[0].mp).toBe(100);
    expect(state.status).not.toBe("FINISHED"); // capping does not win
  });

  it("non-quest gainMP (allowLevelUp:false) caps at 100 and does NOT level up", () => {
    let state = makeState(80, 0);
    state = gainMP(state, "player_1", 0, 40, "GAIN", { allowLevelUp: false }); // 80+40 → cap 100
    const slot = state.players.player_1.activeSlots[0];
    expect(slot.mp).toBe(100);
    expect(slot.level).toBe(0); // never levels from a non-quest gain
  });

  it("quest gainMP (default allowLevelUp) levels up when crossing 100", () => {
    let state = makeState(80, 0);
    state = gainMP(state, "player_1", 0, 45, "QUEST"); // 80+45=125 → Level 1, mp 25
    const slot = state.players.player_1.activeSlots[0];
    expect(slot.level).toBe(1);
    expect(slot.mp).toBe(25);   // 125 - 100 carried into the new level
    expect(slot.mp).toBeLessThan(100);
  });

  it("quest gainMP exactly to 100 levels up and resets to 0", () => {
    let state = makeState(80, 0);
    state = gainMP(state, "player_1", 0, 20, "QUEST"); // exactly 100 → Level 1, mp 0
    const slot = state.players.player_1.activeSlots[0];
    expect(slot.level).toBe(1);
    expect(slot.mp).toBe(0);
  });
});
