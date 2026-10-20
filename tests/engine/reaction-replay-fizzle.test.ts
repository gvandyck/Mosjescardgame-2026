// 61.1-01 (D-01): a held attack whose attacker the Drain Reversal rider puts out of action fizzles (Card List Rulings 2026-10-18).
// Before the fix the replay failed with "This Mosje cannot act" and the whole reaction was refused.
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const attackerDef = MOSJES.find((m: any) => m.id === "mosje_alyssa_bulldozer"); // L1 Power 20
const plain = MOSJES.find((m: any) => m.id !== "mosje_alyssa_bulldozer" && m.id !== "mosje_parkour_west");
const mk = (mp: number, d = plain, level = 1, extra: any = {}) => {
  const s = createMosjeSlot(d, { level, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
const ATT = { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 };

// player_1 attacks player_2 slot 0; player_2 holds Drain Reversal. Returns the open reaction window.
function window(attackerSlots: any[]) {
  const s = makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { activeSlots: attackerSlots },
      player_2: { activeSlots: [mk(50), mk(50)], hand: [{ cardId: "snelle_drain_reversal" }], energy: 6 },
    },
  });
  const w = attackMosje(s, "player_1", ATT);
  expect(w.ok).toBe(true);
  expect(w.state.pendingReaction?.eligible).toContain("snelle_drain_reversal");
  return w.state;
}
const slot = (s: any, pid: string, i: number) => s.players[pid].activeSlots[i];

// The attack did nothing, the Snelle stays paid and used, and no reaction state is left behind.
function expectFizzled(r: any) {
  expect(r.ok, r.error).toBe(true);
  expect(r.state.pendingReaction).toBeUndefined();
  expect(r.state.pendingChoice).toBeUndefined();
  expect(r.state.reactionMods).toBeUndefined();
  const p2 = r.state.players.player_2;
  expect(p2.activeSlots[0].mp).toBe(50); // the defender loses nothing
  expect(p2.energy).toBe(4); // Drain Reversal stays paid (2 Energy)
  expect(p2.hand).toHaveLength(0);
  expect(p2.graveyard.map((g: any) => g.cardId)).toContain("snelle_drain_reversal");
  const att = slot(r.state, "player_1", 0);
  expect(att.sideways).toBe(true); // the rider sidelined the attacker
  expect(att.mp).toBe(0);
  expect(att.actedThisTurn).toBeFalsy(); // the fizzled attack spent no action
}

describe("Drain Reversal rider vs the attacker", () => {
  it("lone opponent Mosje: the rider sidelines the attacker and the attack fizzles", () => {
    const r = resolveReaction(window([mk(10, attackerDef), null]), "player_2", "snelle_drain_reversal");
    expectFizzled(r);
  });

  it("two opponent Mosjes, rider answered with the attacker: the attack fizzles", () => {
    const paused = resolveReaction(window([mk(10, attackerDef), mk(50)]), "player_2", "snelle_drain_reversal");
    expect(paused.ok, paused.error).toBe(true);
    expect(paused.state.pendingChoice.options).toHaveLength(2);
    const pick = paused.state.pendingChoice.options.find((o: any) => o.slotIndex === 0);
    const r = resolvePendingChoice(paused.state, pick);
    expectFizzled(r);
  });

  it("control, rider answered with the other Mosje: the attack still replays", () => {
    const paused = resolveReaction(window([mk(10, attackerDef), mk(50)]), "player_2", "snelle_drain_reversal");
    const pick = paused.state.pendingChoice.options.find((o: any) => o.slotIndex === 1);
    const r = resolvePendingChoice(paused.state, pick);
    expect(r.ok, r.error).toBe(true);
    expect(r.state.pendingReaction).toBeUndefined();
    const att = slot(r.state, "player_1", 0);
    expect(att.mp).toBe(10);
    expect(att.actedThisTurn).toBe(true);
    expect(slot(r.state, "player_1", 1).mp).toBe(40); // the rider hit the other Mosje
    expect(slot(r.state, "player_2", 0).mp).toBe(50); // 20 damage fully soaked by "loses 20 less"
  });

  it("control, Level 2 attacker only drops a level: the attack still replays", () => {
    const r = resolveReaction(window([mk(10, attackerDef, 2), null]), "player_2", "snelle_drain_reversal");
    expect(r.ok, r.error).toBe(true);
    const att = slot(r.state, "player_1", 0);
    expect(att.level).toBe(1);
    expect(att.mp).toBe(50);
    expect(att.actedThisTurn).toBe(true);
  });
});

// 61.1-02 (D-02): the Snelle play's own victory check sweeps a sideways 0 MP target that still carries the stale
// _pendingWelloe flag; the held attack then replayed against an empty slot and the Dodge was refused ("Invalid attack target").
// player_1 attacks player_2 slot 0 (sideways, 0 MP, Physical 2); player_2 holds Perfect Dodge. Returns the open reaction window.
function dodgeWindow(extra: any) {
  const s = makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { activeSlots: [mk(50, attackerDef), mk(50)] },
      player_2: {
        activeSlots: [mk(0, plain, 1, { sideways: true, traits: { physical: 2 }, ...extra }), mk(50)],
        hand: [{ cardId: "snelle_perfect_dodge" }],
        energy: 6,
      },
    },
  });
  const w = attackMosje(s, "player_1", ATT);
  expect(w.ok).toBe(true);
  expect(w.state.pendingReaction?.eligible).toContain("snelle_perfect_dodge");
  return w.state;
}

describe("Perfect Dodge vs a sideways 0 MP Level 1 target", () => {
  it("the window state still carries _pendingWelloe: the Dodge is played, not refused", () => {
    const r = resolveReaction(dodgeWindow({ _pendingWelloe: true }), "player_2", "snelle_perfect_dodge");
    expect(r.ok, r.error).toBe(true);
    expect(r.error).toBeUndefined();
    expect(r.state.pendingReaction).toBeUndefined();
    expect(r.state.reactionMods).toBeUndefined();
    const p2 = r.state.players.player_2;
    expect(p2.hand).toHaveLength(0);
    expect(p2.energy).toBe(4); // Perfect Dodge stays paid (2 Energy)
    expect(p2.graveyard.map((g: any) => g.cardId)).toContain("snelle_perfect_dodge");
    expect(p2.activeSlots[0]).toBeNull(); // the stale flag is swept by the Snelle play's own victory check
    expect(p2.welloePile).toHaveLength(1);
    expect(slot(r.state, "player_1", 0).actedThisTurn).toBeFalsy(); // the attack fizzled: its target was gone, no action spent
  });

  it("control, without the flag the Dodge soaks the hit", () => {
    const r = resolveReaction(dodgeWindow({}), "player_2", "snelle_perfect_dodge");
    expect(r.ok, r.error).toBe(true);
    const p2 = r.state.players.player_2;
    expect(p2.activeSlots[0]).not.toBeNull();
    expect(p2.activeSlots[0].mp).toBe(0);
    expect(p2.activeSlots[0].sideways).toBe(true);
    expect(p2.welloePile).toHaveLength(0);
    expect(p2.energy).toBe(4);
  });
});
