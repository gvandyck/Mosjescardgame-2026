// The Ronald Kip stacking test (CLAUDE.md MP check), on the 2.1 starter text (Phase 71-03, D-38):
// Ronald Kip gives 40 MP; with a Ronald on your field you also draw 1. A gain that reaches 100 at Level 1 or 2 levels the
// Mosje up to 10 MP (no carry-over); at Level 3 the MP stops at 100.
// 71-04 adds: Ronald, The Master Chef +10 on the first food Piecie each turn, and Ronnie's Kitchen +10.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module, no type declarations
import { effect_ronald_kip } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error - JS module, no type declarations
import { gainMP } from "../../src/engine/mpManager.js";

const defOf = (id: string) => MOSJES.find((m: any) => m.id === id);
const card = (i: number) => ({ cardId: "piecie_pot_of_weed", type: "PIECIE", i });

function slot(id: string, level: number, mp: number) {
  const s = createMosjeSlot(defOf(id), { level, mp });
  s.entryProtected = false;
  return s;
}

function board(target: any, partner: any | null, deck = 3) {
  const st = makeEngineState({ players: { player_1: { activeSlots: [target, partner] } } });
  st.players.player_1.deck = Array.from({ length: deck }, (_, i) => card(i));
  st.players.player_1.hand = [];
  return st;
}

const kip = (st: any) => effect_ronald_kip(st, "player_1");
const first = (st: any) => st.players.player_1.activeSlots[0];

describe("Ronald Kip stacking under the 2.1 starter text", () => {
  it("alone: +40, no draw", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), null));
    expect([first(out).level, first(out).mp]).toEqual([1, 40]);
    expect(out.players.player_1.hand).toHaveLength(0);
  });

  it("with Ronald, The Master Chef on the field: +40 and draw 1", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), slot("mosje_ronald_chef", 1, 50)));
    expect(first(out).mp).toBe(40);
    expect(out.players.player_1.hand).toHaveLength(1);
  });

  it("with Ronald and an empty deck: still +40, nothing drawn", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), slot("mosje_ronald_chef", 1, 50), 0));
    expect(first(out).mp).toBe(40);
    expect(out.players.player_1.hand).toHaveLength(0);
  });

  it("a gain that crosses 100 on Level 1 -> Level 2 at 10 MP (from 70: no carry-over)", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 70), null));
    expect([first(out).level, first(out).mp]).toEqual([2, 10]);
  });

  it("a gain that crosses 100 on Level 2 -> Level 3 at 10 MP", () => {
    const out = kip(board(slot("mosje_coert_tech", 2, 70), null));
    expect([first(out).level, first(out).mp]).toEqual([3, 10]);
  });

  it("on Level 3 the gain is capped at 100", () => {
    const out = kip(board(slot("mosje_coert_tech", 3, 70), null));
    expect([first(out).level, first(out).mp]).toEqual([3, 100]);
  });

  // 71-04: Ronald, The Master Chef +10 (first food Piecie each turn) and Ronnie's Kitchen +10 go here.

  it("The Void blocks a Piecie gain; a Quest gain still goes through", () => {
    const st = board(slot("mosje_coert_tech", 1, 0), null);
    st.activePlace = "place_the_void";
    expect(first(gainMP(st, "player_1", 0, 40, "PIECIE")).mp).toBe(0);
    expect(first(gainMP(st, "player_1", 0, 40, "QUEST")).mp).toBeGreaterThan(0);
  });
});
