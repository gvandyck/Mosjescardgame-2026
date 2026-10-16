// Phase 60-01 (EFX-03): Momentum Rush, Bijna Welloe, Ff Haaltje Nemen, Chillingsvoorbij!, Jantje Jantje... Jantje? (Card List numbers).
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { playSnellie } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const mk = (mp: number, fresh = false) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === "mosje_ming_predictor"), { level: 1, mp });
  s.entryProtected = fresh;
  return s;
};
const card = (id: string) => ({ cardId: id, type: "SNELLE_PIECIE" });
function board(own: any[], opp: any[], extra: any = {}, p1: any = {}) {
  return makeEngineState({
    turnNumber: 3, ...extra,
    players: { player_1: { activeSlots: own, energy: 6, ...p1 }, player_2: { activeSlots: opp } },
  });
}
const play = (s: any, id: string) => playSnellie(s, "player_1", card(id), SNELLE_PIECIES.find((d: any) => d.id === id));
const mp = (s: any, who = "player_1", i = 0) => s.players[who].activeSlots[i].mp;

describe("Momentum Rush", () => {
  it("one Mosje: +15; two Mosjes: the picked one", () => {
    expect(mp(play(board([mk(20), null], [mk(40), null], {}, { hand: [card("snelle_momentum_rush")] }), "snelle_momentum_rush").state)).toBe(35);
    const r = play(board([mk(20), mk(20)], [mk(40), null], {}, { hand: [card("snelle_momentum_rush")] }), "snelle_momentum_rush");
    const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
    expect([mp(out, "player_1", 0), mp(out, "player_1", 1)]).toEqual([35, 20]);
  });
});
describe("Bijna Welloe", () => {
  it("only a Mosje with 10 MP or less; none -> refused", () => {
    const s = board([mk(40), mk(10)], [mk(40), null], {}, { hand: [card("snelle_bijna_welloe")] });
    expect(mp(play(s, "snelle_bijna_welloe").state, "player_1", 1)).toBe(30);
    const no = play(board([mk(20), null], [mk(40), null], {}, { hand: [card("snelle_bijna_welloe")] }), "snelle_bijna_welloe");
    expect(no.success).toBe(false);
    expect(no.state.players.player_1.energy).toBe(6);
  });
});
describe("Ff Haaltje Nemen", () => {
  const hand = [card("snelle_ff_haaltje_nemen")];
  const d = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: "piecie_pot_of_weed" + i }));
  it("draws 2; a deck of 1 draws 1; an empty deck draws nothing", () => {
    const h = (n: number) => play(board([mk(20), null], [mk(40), null], {}, { hand: [...hand], deck: d(n) }), "snelle_ff_haaltje_nemen").state.players.player_1.hand.length;
    expect([h(5), h(1), h(0)]).toEqual([2, 1, 0]);
  });
});
describe("Chillingsvoorbij!", () => {
  it("takes the most recently discarded Place; none -> refused", () => {
    const gy = [{ cardId: "place_bank_chilling", type: "PLACE" }, { cardId: "piecie_x", type: "PIECIE" }, { cardId: "place_boxing_ring", type: "PLACE" }, { cardId: "piecie_y", type: "PIECIE" }];
    const r = play(board([mk(20), null], [mk(40), null], {}, { hand: [card("snelle_chillingsvoorbij")], graveyard: gy }), "snelle_chillingsvoorbij");
    expect(r.state.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["place_boxing_ring"]);
    expect(r.state.players.player_1.graveyard.filter((c: any) => c.type === "PLACE")).toHaveLength(1);
    const no = play(board([mk(20), null], [mk(40), null], {}, { hand: [card("snelle_chillingsvoorbij")] }), "snelle_chillingsvoorbij");
    expect(no.success).toBe(false);
    expect(no.state.players.player_1.energy).toBe(6);
  });
});
describe("Jantje Jantje... Jantje?", () => {
  const p1 = { hand: [card("snelle_jantje_jantje_jantje")] };
  it("with Bank Chilling: opponent -15, own +15; without: refused", () => {
    const r = play(board([mk(20), null], [mk(40), null], { activePlace: "place_bank_chilling" }, p1), "snelle_jantje_jantje_jantje");
    expect([mp(r.state), mp(r.state, "player_2")]).toEqual([35, 25]);
    expect(play(board([mk(20), null], [mk(40), null], {}, p1), "snelle_jantje_jantje_jantje").success).toBe(false);
  });
  it("a fresh opponent Mosje is not an option; the other one is hit", () => {
    const r = play(board([mk(20), null], [mk(40, true), mk(40)], { activePlace: "place_bank_chilling" }, p1), "snelle_jantje_jantje_jantje");
    expect([mp(r.state, "player_2", 0), mp(r.state, "player_2", 1)]).toEqual([40, 25]);
  });
});
