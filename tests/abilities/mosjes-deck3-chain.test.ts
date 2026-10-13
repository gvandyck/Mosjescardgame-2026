// EFX-01 Example Deck 3 chain Mosjes: Jisca (Perfect Combo), Dancing/DDR Chris (Perfect Combo Chain),
// Cless, The Teacher (Teaching Moment) on the piecieActivated hook. The §6b chain-rule cases live in
// tests/engine/free-activation-chain.test.ts.
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { activatePiecie, startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { MOSJE_TRIGGERS } from "../../src/engine/mosje/mosjeTriggers.js";
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice, shiftTestDie } from "../../src/engine/dice/testDiceQueue.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";

afterEach(() => clearTestDice());
const rest = () => { const out: number[] = []; for (let d = shiftTestDie(); d !== null; d = shiftTestDie()) out.push(d); return out; };

const KANNETJE = "piecie_kannetje_melk"; // cost 0, +25 to one of your Mosjes
const mk = (cardId: string, mp = 30, extra: any = {}) => ({ cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra });
const placed = (cardId = KANNETJE, extra: any = {}) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1, ...extra });
const build = (mosjes: any[], slots: any[], p1: any = {}, foe: any[] = [mk("mosje_b", 50), null]) => makeEngineState({
  turnNumber: 3,
  players: { player_1: { energy: 6, activeSlots: mosjes, piecieSlots: slots, ...p1 }, player_2: { activeSlots: foe } },
});
const settle = (res: any) => { while (res.state.pendingChoice) res = resolvePendingChoice(res.state, res.state.pendingChoice.options[0]); return res; };
const p1 = (res: any) => res.state.players.player_1;

describe("Jisca: Perfect Combo", () => {
  const board = (slots: any[], extra: any = {}) => build([mk("mosje_jisca", 30), null], slots, extra);

  it("die 5: another ready Piecie is activated free (auto with one) and the foe loses 15", () => {
    pushTestDice([5]);
    const res = activatePiecie(board([placed(), placed(), null]), "player_1", 0);
    expect(res.state.pendingChoice).toBeUndefined();
    expect(p1(res).piecieSlots.every((s: any) => s === null)).toBe(true);
    expect(p1(res).energy).toBe(6); // cost 0 Piecies; the freed one paid nothing either way
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(35);
  });

  it("with two other ready Piecies the owner picks which one", () => {
    pushTestDice([5]);
    const res = activatePiecie(board([placed(), placed("piecie_broodje_doner"), placed()]), "player_1", 0);
    expect(res.state.pendingChoice.key).toBe("jisca_piecie");
    expect(res.state.pendingChoice.options).toHaveLength(2);
    const done = settle(res);
    expect(p1(done).piecieSlots.filter((s: any) => s !== null)).toHaveLength(1);
  });

  it("free activation costs no Energy", () => {
    pushTestDice([5]);
    const res = activatePiecie(board([placed(), placed("piecie_te_hard_gaan"), null]), "player_1", 0);
    expect(p1(res).energy).toBe(6); // Te Hard Gaan (cost 2) came free
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(10); // 50 - 25 (Te Hard Gaan) - 15
  });

  it("die 2: Jisca loses 10; at 0 MP nothing is lost", () => {
    pushTestDice([2]);
    const hard = () => board([placed("piecie_te_hard_gaan"), null, null]);
    expect(p1(activatePiecie(hard(), "player_1", 0)).activeSlots[0].mp).toBe(20);
    clearTestDice();
    pushTestDice([2]);
    const broke = hard();
    broke.players.player_1.activeSlots[0].mp = 0;
    expect(p1(activatePiecie(broke, "player_1", 0)).activeSlots[0].mp).toBe(0);
  });

  it("die 5 without another ready Piecie: the foe still loses 15", () => {
    pushTestDice([5]);
    const res = activatePiecie(board([placed(), null, null]), "player_1", 0);
    expect(res.state.players.player_2.activeSlots[0].mp).toBe(35);
  });

  it("rolls only for her first paid activation each turn", () => {
    pushTestDice([2, 6]);
    const hard = "piecie_te_hard_gaan";
    const first = activatePiecie(board([placed(hard), placed(hard), null]), "player_1", 0);
    expect(p1(first).jiscaRolledThisTurn).toBe(true);
    const second = activatePiecie(first.state, "player_1", 1);
    expect(second.success).toBe(true);
    expect(rest()).toEqual([6]); // the second paid activation did not roll
  });

  it("startTurn resets the once-per-turn flag", () => {
    const s = board([null, null, null], { jiscaRolledThisTurn: true, ddrChainsThisTurn: 2 });
    s.players.player_1.deck = [{ cardId: "x", type: "PLACE" }];
    const next = startTurn(s, "player_1");
    expect(next.players.player_1.jiscaRolledThisTurn).toBe(false);
    expect(next.players.player_1.ddrChainsThisTurn).toBe(0);
  });
});

describe("Dancing/DDR Chris: Perfect Combo Chain", () => {
  const board = (slots: any[]) => build([mk("mosje_chris_ddr", 30), null], slots);

  it("die 6 on two paid activations: two free activations; then no more rolls this turn", () => {
    pushTestDice([6, 6, 6]);
    const first = activatePiecie(board([placed(), placed(), placed(), null]), "player_1", 0);
    const chosen = settle(first);
    expect(p1(chosen).ddrChainsThisTurn).toBe(1);
    // refill two ready Piecies and activate again
    const st = chosen.state;
    st.players.player_1.piecieSlots = [placed(), placed(), placed(), null];
    const second = settle(activatePiecie(st, "player_1", 0));
    expect(p1(second).ddrChainsThisTurn).toBe(2);
    const st2 = second.state;
    st2.players.player_1.piecieSlots = [placed(), placed(), null, null];
    activatePiecie(st2, "player_1", 0);
    expect(rest()).toEqual([6]); // capped at 2: the third paid activation rolled nothing
  });

  it("die 5 with no ready Piecie: nothing happens and it does not count toward the 2", () => {
    pushTestDice([5]);
    const res = activatePiecie(board([placed(), null, null]), "player_1", 0);
    expect(p1(res).ddrChainsThisTurn || 0).toBe(0);
  });

  it("die 4: no chain", () => {
    pushTestDice([4]);
    const res = activatePiecie(board([placed(), placed(), null]), "player_1", 0);
    expect(p1(res).piecieSlots[1].activated).toBe(false);
  });
});

describe("Cless, The Teacher: Teaching Moment", () => {
  const board = (extraMosje: any = null) => build([mk("mosje_cless_teacher", 30), extraMosje], [placed(), null, null], { deck: [{ cardId: "x", type: "PLACE" }] });

  it("die 5: draw 1 and the owner picks a Mosje that gains 5", () => {
    pushTestDice([5]);
    const res = activatePiecie(board(mk("mosje_c", 40)), "player_1", 0);
    expect(res.state.pendingChoice.options).toHaveLength(2);
    expect(p1(res).hand).toHaveLength(1); // drawn once, before the pick
    const done = resolvePendingChoice(res.state, res.state.pendingChoice.options[1]);
    expect(done.state.players.player_1.hand).toHaveLength(1); // no second draw on resume
    expect(done.state.players.player_1.activeSlots[1].mp).toBe(45);
  });

  it("die 4: nothing; die 4 with Martin, The Historian on the field: draws", () => {
    pushTestDice([4]);
    const plain = activatePiecie(board(mk("mosje_c", 40)), "player_1", 0);
    expect(p1(plain).hand).toHaveLength(0);
    clearTestDice();
    pushTestDice([4]);
    const synergy = activatePiecie(board(mk("mosje_martin_historian", 40)), "player_1", 0);
    expect(p1(synergy).hand).toHaveLength(1);
  });

  it("a free activation triggers none of the three", () => {
    expect(MOSJE_TRIGGERS.piecieActivated.map((e: any) => e.mosjeId)).toEqual(["mosje_jisca", "mosje_chris_ddr", "mosje_cless_teacher"]);
    for (const e of MOSJE_TRIGGERS.piecieActivated) {
      const s = board();
      pushTestDice([6]);
      expect(e.run(s, { free: true, ownerId: "player_1", holderSlotIndex: 0 })).toBe(s);
      expect(rest()).toEqual([6]);
      clearTestDice();
    }
  });
});
