// E23 — Snelle slot rule and immediate discard (Phase 57-03, TABLE-03)
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { playSnellie, endTurn } from "../../src/engine/turnManager.js";

const mosje = (n: string) => ({ cardId: n, name: n, mp: 50, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const filled = (id: string) => ({ cardId: id, type: "PIECIE", faceDown: true, activated: false });
function player(slots: any[], hand: string[], energy = 6) {
  return {
    energy, hand: hand.map((cardId) => ({ cardId })), deck: [{ cardId: "x" }], graveyard: [], questsCompleted: 0, questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0, pieciesActivatedThisTurn: 0, pieciesPlayedThisTurn: 0, actionsThisTurn: [],
    questPrepBonus: 0, totalDamageTaken: 0, activeSlots: [mosje("mosje_a"), null], piecieSlots: slots,
  };
}
function make(slots: any[], hand: string[], opts: any = {}) {
  return {
    activePlayerId: opts.active ?? "player_1", turnNumber: 2, activePlace: opts.place ?? null, activeQuest: null, sharedPlaceSlot: null,
    status: "IN_PROGRESS", winnerId: null, winReason: null, _snelleFlags: {}, _pendingTargets: {}, sharedGeneralQuestDiscard: [],
    players: { player_1: { ...player(slots, hand, opts.energy ?? 6), ...(opts.p1 ?? {}) }, player_2: player([null, null, null], []) },
  } as any;
}
const rush = { name: "Momentum Rush", effectId: "effect_snelle_momentum_rush", cost: 2 };
const blensen = { name: "Blensen!", effectId: "effect_snelle_blensen", cost: 4, stays: "endOfTurn" };
const ref = (cardId: string) => ({ cardId, type: "SNELLE_PIECIE" });
const gy = (s: any, p = "player_1") => s.players[p].graveyard.map((g: any) => g.cardId);

describe("Snelle slot rule (E23)", () => {
  it("3 filled Piecie slots: refused, hand and Energy unchanged", () => {
    const s = make([filled("a"), filled("b"), filled("c")], ["snelle_momentum_rush"]);
    const r = playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.hand).toHaveLength(1);
    expect(r.state.players.player_1.energy).toBe(6);
  });
  it("2 filled slots + active Place: succeeds (Place uses no slot)", () => {
    const s = make([filled("a"), filled("b"), null], ["snelle_momentum_rush"], { place: "place_x" });
    expect(playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush).success).toBe(true);
  });
  it("resolved Snelle frees its slot and lands on the discard top; Energy paid", () => {
    const s = make([null, null, null], ["snelle_momentum_rush"]);
    const r = playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush);
    expect(r.success).toBe(true);
    expect(r.state.players.player_1.piecieSlots).toEqual([null, null, null]);
    expect(gy(r.state).at(-1)).toBe("snelle_momentum_rush");
    expect(r.state.players.player_1.energy).toBe(4);
  });
  it("playable on the opponent's turn with saved Energy", () => {
    const s = make([null, null, null], ["snelle_momentum_rush"], { active: "player_2" });
    expect(playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush).success).toBe(true);
  });
  it("Blensen! stays face-up, then is discarded at endTurn (also when played off-turn)", () => {
    const s = make([null, null, null], ["snelle_blensen"], { active: "player_2" });
    const r = playSnellie(s, "player_1", ref("snelle_blensen"), blensen);
    expect(r.success).toBe(true);
    const e = r.state.players.player_1.piecieSlots.find((x: any) => x);
    expect(e.cardId).toBe("snelle_blensen");
    expect(e.faceDown).toBe(false);
    const after = endTurn(r.state);
    const st = after.state ?? after;
    expect(st.players.player_1.piecieSlots.every((x: any) => x === null)).toBe(true);
    expect(gy(st)).toContain("snelle_blensen");
  });
  it("cooldown turn: refused with COOLDOWN_ERROR, nothing moved", () => {
    const s = make([null, null, null], ["snelle_momentum_rush"], { p1: { cooldownTurn: true } });
    const r = playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/cooldown/i);
    expect(r.state.players.player_1.energy).toBe(6);
  });
  it("not enough Energy: refused, nothing moved", () => {
    const s = make([null, null, null], ["snelle_momentum_rush"], { energy: 1 });
    const r = playSnellie(s, "player_1", ref("snelle_momentum_rush"), rush);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.hand).toHaveLength(1);
    expect(r.state.players.player_1.piecieSlots).toEqual([null, null, null]);
  });
});
