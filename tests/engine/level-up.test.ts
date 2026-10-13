// @ts-expect-error — JS module, no type declarations
import { pushTestDice } from "../../src/engine/dice/testDiceQueue.js";
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
  // 2.0 (55-02): the V4 +10 turn trickle is gone, so a Mosje at 95 no longer
  // levels at turn start; it stays Level 1 at 95 MP.
  it("no turn trickle: a Mosje at 95 does not level at turn start", () => {
    const st = makeState(95, 1);
    st.players.player_1.deck = [];
    pushTestDice([3]); // Gandoe Wizard's Chaos Roll (start of turn): 3-4 = nothing
    const out = startTurn(st, "player_1");
    expect(out.players.player_1.activeSlots[0].level).toBe(1);
    expect(out.players.player_1.activeSlots[0].mp).toBe(95);
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

// 54-14: ability, Quest and Snelle gains go through applyGainToSlot (RULE-02/03).
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
// @ts-expect-error — JS module, no type declarations
import { effect_snelle_momentum_rush } from "../../src/abilities/snelleEffects.js";

function abilityState(level: number, mp: number, defId = "mosje_gandoe_wizard") {
  const d = MOSJES.find((m: any) => m.id === defId);
  const s = createMosjeSlot(d, { level, mp });
  s.entryProtected = false;
  return makeEngineState({
    turnNumber: 5,
    players: { player_1: { activeSlots: [s, null], hand: [{ cardId: "x" }, { cardId: "y" }] } },
  });
}
const mine = (st: any) => st.players.player_1.activeSlots[0];

describe("ability / Quest / Snelle gains (54-14)", () => {
  it("E3 from a Quest: success taking L1 at 95 over 100 -> L2 at 0 MP", () => {
    // 2.0 Quick Thinking win is +25 (Card List): 95 + 25 = 120 -> L2 at 0.
    const st = forceQuestResult(abilityState(1, 95), "player_1", { questId: "quest_quick_thinking", win: true });
    expect([mine(st).level, mine(st).mp]).toEqual([2, 0]);
  });
  it("Jeffrey Brute Force (+10 after a Quest) can level: L1 at 70 + Quest 25 -> L2 at 0", () => {
    // Start 70 (was 90 with a V4 +5 Quest): 70 + 25 = 95 stays L1, then Brute Force +10 = 105 -> L2 at 0
    const st = forceQuestResult(abilityState(1, 70, "mosje_jeffrey"), "player_1", { questId: "quest_quick_thinking", win: true });
    expect([mine(st).level, mine(st).mp]).toEqual([2, 0]);
  });
  it("Momentum Rush (Snelle, bare effect): L1 at 95 -> L2 at 0; L3 at 90 caps at 95", () => {
    const a = effect_snelle_momentum_rush(abilityState(1, 95), "player_1");
    expect([mine(a).level, mine(a).mp]).toEqual([2, 0]);
    const b = effect_snelle_momentum_rush(abilityState(3, 90), "player_1");
    expect([mine(b).level, mine(b).mp]).toEqual([3, 95]);
  });
});
