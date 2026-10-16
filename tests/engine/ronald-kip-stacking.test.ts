// The Ronald Kip stacking test (CLAUDE.md MP check), on the Card List 2.0 texts (Phase 59, section 6b):
// Ronald Kip +50, +60 and a draw with Ronald, The Master Chef; MP Amplifier doubles the NEXT gain this turn (max +40
// extra, any source): Kip + Amplifier 90, with Ronald 100 (level-up per applyGainToSlot: 100+ -> next Level at 0 MP,
// Level 3 stops at 95). The Binti food extra is part of the gain that gets doubled.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module, no type declarations
import { effect_ronald_kip, effect_mp_amplifier } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error - JS module, no type declarations
import { gainMP } from "../../src/engine/mpManager.js";
// @ts-expect-error - JS module, no type declarations
import { expireThisTurnEffects } from "../../src/engine/turn/expireThisTurnEffects.js";

const defOf = (id: string) => MOSJES.find((m: any) => m.id === id);
const card = (i: number) => ({ cardId: "piecie_pot_of_weed", type: "PIECIE", i });

function slot(id: string, level: number, mp: number) {
  const s = createMosjeSlot(defOf(id), { level, mp });
  s.entryProtected = false;
  return s;
}

function board(target: any, partner: any | null, amplified = false, deck = 3) {
  const st = makeEngineState({ players: { player_1: { activeSlots: [target, partner] } } });
  st.players.player_1.deck = Array.from({ length: deck }, (_, i) => card(i));
  st.players.player_1.hand = [];
  if (amplified) st.players.player_1 = effect_mp_amplifier(st, "player_1").players.player_1;
  return st;
}

const kip = (st: any) => effect_ronald_kip(st, "player_1");
const first = (st: any) => st.players.player_1.activeSlots[0];

describe("Ronald Kip stacking under the Card List 2.0 rules", () => {
  it("alone: +50", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), null));
    expect([first(out).level, first(out).mp]).toEqual([1, 50]);
    expect(out.players.player_1.hand).toHaveLength(0);
  });

  it("with Ronald, The Master Chef on the field: +60 and draw 1", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), slot("mosje_ronald_chef", 1, 50)));
    expect(first(out).mp).toBe(60);
    expect(out.players.player_1.hand).toHaveLength(1);
  });

  it("with Ronald and an empty deck: still +60, nothing drawn", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), slot("mosje_ronald_chef", 1, 50), false, 0));
    expect(first(out).mp).toBe(60);
    expect(out.players.player_1.hand).toHaveLength(0);
  });

  it("MP Amplifier then Ronald Kip: 50 doubles by 40 at most -> 90, flag used up", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), null, true));
    expect([first(out).level, first(out).mp]).toEqual([1, 90]);
    expect(out.players.player_1.mpAmplifierThisTurn).toBe(false);
  });

  it("MP Amplifier, Ronald Kip and Ronald: 60 + 40 = 100 -> Level 2 at 0 MP", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 0), slot("mosje_ronald_chef", 1, 50), true));
    expect([first(out).level, first(out).mp]).toEqual([2, 0]);
  });

  it("the Amplifier doubles a Quest win of 40 -> 80, once only", () => {
    let st = board(slot("mosje_coert_tech", 1, 0), null, true);
    st = gainMP(st, "player_1", 0, 40, "QUEST");
    expect(first(st).mp).toBe(80);
    st = gainMP(st, "player_1", 0, 5, "QUEST");
    expect(first(st).mp).toBe(85); // second gain: no boost
  });

  it("small gains simply double (15 -> 30)", () => {
    const st = gainMP(board(slot("mosje_coert_tech", 1, 0), null, true), "player_1", 0, 15, "ABILITY");
    expect(first(st).mp).toBe(30);
  });

  it("an unused Amplifier ends with the turn", () => {
    const st = board(slot("mosje_coert_tech", 1, 0), null, true);
    st.activePlayerId = "player_1";
    expireThisTurnEffects(st);
    expect(gainMP(st, "player_1", 0, 15, "GAIN").players.player_1.activeSlots[0].mp).toBe(15);
  });

  it("Binti's food extra is part of the doubled gain: (50 + 10) + 40 = 100 -> Level 2", () => {
    const out = kip(board(slot("mosje_binti", 1, 0), slot("mosje_coert_tech", 1, 50), true));
    expect([first(out).level, first(out).mp]).toEqual([2, 0]);
  });

  it("a gain that crosses 100 on Level 1 -> Level 2 at 0 MP (no carry-over)", () => {
    const out = kip(board(slot("mosje_coert_tech", 1, 60), null));
    expect([first(out).level, first(out).mp]).toEqual([2, 0]);
  });

  it("on Level 3 the gain is capped at 95", () => {
    const out = kip(board(slot("mosje_coert_tech", 3, 70), null));
    expect([first(out).level, first(out).mp]).toEqual([3, 95]);
  });

  it("The Void blocks the gain and the Amplifier is not spent", () => {
    const st = board(slot("mosje_coert_tech", 1, 0), null, true);
    st.activePlace = "place_the_void";
    const out = gainMP(st, "player_1", 0, 40, "QUEST");
    expect(first(out).mp).toBe(0);
    expect(out.players.player_1.mpAmplifierThisTurn).toBe(true);
  });
});
