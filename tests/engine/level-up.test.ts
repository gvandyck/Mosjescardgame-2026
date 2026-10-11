import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { applyGainToSlot } from "../../src/engine/mp/applyGainToSlot.js";
// @ts-expect-error — JS module, no type declarations
import { normalizeSlotMp } from "../../src/engine/mp/normalizeSlotMp.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { gainMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
const slot = (level: number, mp: number) => createMosjeSlot(def, { level, mp });

describe("applyGainToSlot (E3, E7b)", () => {
  it("E3: L1 at 95 + 10 -> L2 at 0 MP with level-2 traits and levelledUpTurn", () => {
    const s = slot(1, 95);
    const r = applyGainToSlot(s, 10, { turnNumber: 4 });
    expect(r.leveled).toBe(true);
    expect(s.level).toBe(2);
    expect(s.mp).toBe(0);
    expect(s.traits).toEqual(def.levels[1].traits);
    expect(s.levelledUpTurn).toBe(4);
  });
  it("L2 at 95 + 10 -> L3 at 0", () => {
    const s = slot(2, 95);
    applyGainToSlot(s, 10);
    expect(s.level).toBe(3);
    expect(s.mp).toBe(0);
  });
  it("one level per gain: L1 at 90 + 200 -> L2 at 0", () => {
    const s = slot(1, 90);
    applyGainToSlot(s, 200);
    expect(s.level).toBe(2);
    expect(s.mp).toBe(0);
  });
  it("E7b: L3 at 90 + 25 -> 95, and L3 at 95 + 5 stays 95", () => {
    const s = slot(3, 90);
    applyGainToSlot(s, 25);
    expect(s.mp).toBe(95);
    expect(s.level).toBe(3);
    applyGainToSlot(s, 5);
    expect(s.mp).toBe(95);
  });
  it("ignores 0, negative, NaN gains and defeated slots", () => {
    const s = slot(1, 40);
    for (const a of [0, -5, NaN]) expect(applyGainToSlot(s, a).gained).toBe(0);
    expect(s.mp).toBe(40);
    s.isDefeated = true;
    applyGainToSlot(s, 20);
    expect(s.mp).toBe(40);
  });
  it("rounds a gain onto the 5-grid", () => {
    const s = slot(1, 10);
    applyGainToSlot(s, 7);
    expect(s.mp % 5).toBe(0);
  });
});

describe("normalizeSlotMp", () => {
  it("levels, caps, snaps and floors", () => {
    const a = slot(1, 5); a.mp = 105;
    expect(normalizeSlotMp(a, { turnNumber: 2 })).toBe(true);
    expect([a.level, a.mp, a.levelledUpTurn]).toEqual([2, 0, 2]);
    const b = slot(3, 5); b.mp = 120; normalizeSlotMp(b); expect(b.mp).toBe(95);
    const c = slot(1, 5); c.mp = 33; normalizeSlotMp(c); expect(c.mp).toBe(35);
    const d = slot(1, 5); d.mp = -10; normalizeSlotMp(d); expect(d.mp).toBe(0);
    const e = slot(1, 5); e.mp = NaN; normalizeSlotMp(e); expect(e.mp).toBe(0);
  });
});

function makeState(mp: number, level: number) {
  const mk = (id: string) => ({
    name: id, hand: [], deck: [], graveyard: [], discard: [],
    activeSlots: [id === "player_1" ? slot(level, mp) : createMosjeSlot(def, { level: 1, mp: 50 }), null],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0, questsCompletedThisTurn: 0, questsAttemptedThisTurn: 0,
    pieciesPlayedThisTurn: 0, totalDamageTaken: 0,
  });
  return {
    status: "PLAYING", activePlayerId: "player_1", turnNumber: 6, activePlace: null,
    players: { player_1: mk("player_1"), player_2: mk("player_2") },
  } as any;
}

describe("engine wrappers", () => {
  it("gainMP: L1 at 95 + 10 -> L2 at 0 and levelledUpTurn = turnNumber", () => {
    const out = gainMP(makeState(95, 1), "player_1", 0, 10, "GAIN");
    const s = out.players.player_1.activeSlots[0];
    expect([s.level, s.mp, s.levelledUpTurn]).toEqual([2, 0, 6]);
  });
  it("checkVictory backstop levels a >=100 Mosje", () => {
    const st = makeState(5, 1);
    st.players.player_1.activeSlots[0].mp = 105;
    const s = checkVictory(st).players.player_1.activeSlots[0];
    expect([s.level, s.mp]).toEqual([2, 0]);
  });
  it("turn trickle can level a Mosje at 95", () => {
    const st = makeState(95, 1);
    st.players.player_1.deck = [];
    const out = startTurn(st, "player_1");
    expect(out.players.player_1.activeSlots[0].level).toBe(2);
  });
});

// 54-13: Piecie MP gains go through applyGainToSlot (RULE-02/03).
// @ts-expect-error — JS module, no type declarations
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { makePiecieState } from "../helpers/makePiecieState.js";

// @ts-expect-error — JS module, no type declarations
import { effect_kannetje_melk } from "../../src/abilities/piecieEffects.js";

describe("Piecie gains (54-13)", () => {
  // Called on the bare effect (no checkVictory) so the normaliser backstop cannot mask a missing funnel.
  it("effect alone: Kannetje Melk on L1 at 95 -> L2 at 0 MP", () => {
    const st = makePiecieState({ piecieId: "piecie_kannetje_melk", own: { level: 1, mp: 95 } });
    const s = effect_kannetje_melk(st, "player_1").players.player_1.activeSlots[0];
    expect([s.level, s.mp]).toEqual([2, 0]);
  });
  it("effect alone: Kannetje Melk at L3 90 caps at 95", () => {
    const st = makePiecieState({ piecieId: "piecie_kannetje_melk", own: { level: 3, mp: 90 } });
    const s = effect_kannetje_melk(st, "player_1").players.player_1.activeSlots[0];
    expect([s.level, s.mp]).toEqual([3, 95]);
  });
  it("E3 via Piecie: Kannetje Melk on L1 at 95 -> L2 at 0 MP", () => {
    const st = makePiecieState({ piecieId: "piecie_kannetje_melk", own: { level: 1, mp: 95 } });
    const r = activatePiecie(st, "player_1", 0);
    expect(r.success).toBe(true);
    const s = r.state.players.player_1.activeSlots[0];
    expect([s.level, s.mp]).toEqual([2, 0]);
  });
  it("E7b via Piecie: Kannetje Melk at L3 90 caps at 95", () => {
    const st = makePiecieState({ piecieId: "piecie_kannetje_melk", own: { level: 3, mp: 90 } });
    const s = activatePiecie(st, "player_1", 0).state.players.player_1.activeSlots[0];
    expect([s.level, s.mp]).toEqual([3, 95]);
  });
});
