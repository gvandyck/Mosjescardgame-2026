// Phase 60-03 (EFX-03): Jensen!, Frenssen!, Blensen!, Counter Strikka, Jammertje Gepakt!, Dubbele Temminks, Gevalletje Klakkeloos.
// Held card = Affoe (one star, 1 Energy): the opponent Mosje loses 15 MP, one of your Mosjes gains 10. Numbers come from the Card List.
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error
import { getSnelleCost } from "../../src/engine/energy/getSnelleCost.js";
// @ts-expect-error
import { piecieTargetOptions } from "../../src/engine/targets/piecieTargetOptions.js";
// @ts-expect-error
import * as fx from "../../src/abilities/snelleEffects.js";
// @ts-expect-error
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const ming = MOSJES.find((m: any) => m.id === "mosje_ming_predictor");
const mk = (mp: number, extra: any = {}) => Object.assign(createMosjeSlot(ming, { level: 1, mp }), { entryProtected: false }, extra);
const H = (...ids: string[]) => ids.map((cardId) => ({ cardId }));
const ready = (cardId: string) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, canActivateOnTurn: 1 });
const MENTAL2 = { traits: { mental: 2 } };

// player_1 (active) activates the Piecie in slot 0; player_2 is the defender.
function board(p1: any = {}, p2: any = {}, piecie = "piecie_affoe") {
  return makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { activeSlots: [mk(30), null], piecieSlots: [ready(piecie), null, null], energy: 6, ...p1 },
      player_2: { activeSlots: [mk(50, MENTAL2), null], energy: 6, ...p2 },
    },
  });
}
const mp = (s: any, pid: string, i = 0) => s.players[pid].activeSlots[i].mp;
const ids = (list: any[]) => list.map((c) => c.cardId);
const go = (s: any) => activatePiecie(s, "player_1", 0).state;
const answer = (s: any, pid: string, card: string | null) => resolveReaction(s, pid, card);

describe("Jensen! / Frenssen! / Blensen!", () => {
  it("Jensen! cancels the Piecie: no effect, owner's discard, Energy stays spent", () => {
    const r = answer(go(board({}, { hand: H("snelle_jensen") })), "player_2", "snelle_jensen");
    const s = r.state;
    expect(s.pendingReaction).toBeUndefined();
    expect(mp(s, "player_2")).toBe(50);
    expect(mp(s, "player_1")).toBe(30);
    expect(ids(s.players.player_1.graveyard)).toContain("piecie_affoe");
    expect(s.players.player_1.piecieSlots[0]).toBeNull();
    expect(s.players.player_1.energy).toBe(5);
    expect(s.players.player_2.energy).toBe(5);
    expect(ids(s.players.player_2.graveyard)).toContain("snelle_jensen");
  });
  it("Frenssen! cancels the Jensen!: the Piecie resolves and a Mosje of the Jensen! player loses 10", () => {
    const w = answer(go(board({ hand: H("snelle_frenssen") }, { hand: H("snelle_jensen") })), "player_2", "snelle_jensen").state;
    expect(w.pendingReaction.moments).toEqual(["jensenPlayed"]);
    const s = answer(w, "player_1", "snelle_frenssen").state;
    expect(s.pendingReaction).toBeUndefined();
    expect(mp(s, "player_2")).toBe(25); // 50 - 10 (Frenssen!) - 15 (Affoe)
    expect(mp(s, "player_1")).toBe(40);
    expect(s.players.player_1.energy).toBe(3); // Affoe 1 + Frenssen! 2
    expect(s.players.player_1.graveyard.some((c: any) => c.cardId === "snelle_frenssen")).toBe(true);
  });
  it("after Frenssen! the Jensen! player gets a targeted window; Blensen! is free there and the hit fizzles", () => {
    const base = board({ hand: H("snelle_frenssen") }, { hand: H("snelle_jensen", "snelle_blensen") });
    const w = answer(go(base), "player_2", "snelle_jensen").state;
    const t = answer(w, "player_1", "snelle_frenssen").state;
    expect(t.pendingReaction.responderId).toBe("player_2");
    expect(t.pendingReaction.eligible).toContain("snelle_blensen");
    const s = answer(t, "player_2", "snelle_blensen").state;
    expect(s.players.player_2.energy).toBe(5); // Jensen! 1 + Blensen! free
    expect(mp(s, "player_2")).toBe(40); // only Frenssen!'s 10; Affoe fizzled
    expect(ids(s.players.player_1.graveyard)).toContain("piecie_affoe");
  });
  it("Blensen! costs 4 without a Jensen!/Frenssen! this turn, 0 after one", () => {
    const def = SNELLE_PIECIES.find((d: any) => d.id === "snelle_blensen");
    const s = board();
    expect(getSnelleCost(s, "player_2", def)).toBe(4);
    expect(getSnelleCost({ ...s, jensenPlayedTurn: 3 }, "player_2", def)).toBe(0);
    expect(getSnelleCost({ ...s, jensenPlayedTurn: 2 }, "player_2", def)).toBe(4);
  });
  it("Blensen! shield: opponent pickers lose the Mosjes, own pickers and later turns keep them", () => {
    const s = fx.effect_snelle_blensen(board(), "player_2");
    const opp = (st: any) => piecieTargetOptions(st, "player_1", "piecie_affoe").find((t: any) => t.key === "opp_slot_index").options;
    expect(opp(s)).toHaveLength(0);
    expect(opp({ ...s, turnNumber: 4 })).toHaveLength(1);
    expect(piecieTargetOptions(s, "player_1", "piecie_affoe").find((t: any) => t.key === "own_slot_index").options).toHaveLength(1);
  });
});

describe("Counter Strikka / Jammertje Gepakt!", () => {
  it("Jammertje Gepakt! puts the Piecie on the bottom of the owner's deck, Energy stays spent", () => {
    const s = answer(go(board({ deck: H("x1", "x2") }, { hand: H("snelle_jammertje_gepakt") })), "player_2", "snelle_jammertje_gepakt").state;
    expect(mp(s, "player_2")).toBe(50);
    expect(ids(s.players.player_1.deck)).toEqual(["x1", "x2", "piecie_affoe"]);
    expect(s.players.player_1.energy).toBe(5);
    expect(s.players.player_2.hand).toHaveLength(0); // Mental 2: no extra card
  });
  it("Jammertje Gepakt! Mental 3 also draws 1", () => {
    const p2 = { activeSlots: [mk(50, { traits: { mental: 3 } }), null], hand: H("snelle_jammertje_gepakt"), deck: H("d1") };
    const s = answer(go(board({}, p2)), "player_2", "snelle_jammertje_gepakt").state;
    expect(ids(s.players.player_2.hand)).toEqual(["d1"]);
  });
  it("Counter Strikka moves the held Piecie's chosen target to the other legal Mosje", () => {
    const two = board({}, { activeSlots: [mk(50, MENTAL2), mk(50)], hand: H("snelle_counter_strikka") });
    two._pendingTargets = { opp_slot_index: 0 }; // what the activation picker stores
    const window = go(two);
    expect(window.pendingReaction.eligible).toContain("snelle_counter_strikka");
    const s = answer(window, "player_2", "snelle_counter_strikka").state;
    expect(mp(s, "player_2", 0)).toBe(50);
    expect(mp(s, "player_2", 1)).toBe(35);
    expect(s.players.player_2.energy).toBe(4);
  });
  it("Counter Strikka with no other legal target changes nothing (Energy spent)", () => {
    const s = answer(go(board({}, { hand: H("snelle_counter_strikka") })), "player_2", "snelle_counter_strikka").state;
    expect(mp(s, "player_2")).toBe(35);
  });
});

describe("Dubbele Temminks / Gevalletje Klakkeloos", () => {
  it("Dubbele Temminks repeats the activated Piecie's effect", () => {
    const w = go(board({ hand: H("snelle_dubbele_temminks") }));
    expect(w.pendingReaction.moments).toEqual(["afterOwnPiecieActivation"]);
    const s = answer(w, "player_1", "snelle_dubbele_temminks").state;
    expect(mp(s, "player_2")).toBe(20); // -15 twice
    expect(mp(s, "player_1")).toBe(50); // +10 twice
    expect(s.players.player_1.pieciesActivatedThisTurn).toBe(1);
  });
  it("neither is offered on a five-star Piecie", () => {
    const b = board({ hand: H("snelle_dubbele_temminks"), activeSlots: [mk(30, { level: 2 }), null] }, { hand: H("snelle_gevalletje_klakkeloos"), activeSlots: [mk(30, MENTAL2), null] }, "piecie_klaar_met_jou");
    b.players.player_1.activeSlots[0].level = 2;
    const w = go(b);
    expect(w.pendingReaction?.eligible || []).not.toContain("snelle_gevalletje_klakkeloos");
    expect(w.pendingReaction?.eligible || []).not.toContain("snelle_dubbele_temminks");
  });
  it("Gevalletje Klakkeloos gives the copier the same effect with their own targets, and it is not an activation", () => {
    const s = answer(go(board({}, { hand: H("snelle_gevalletje_klakkeloos"), activeSlots: [mk(50, MENTAL2), null] })), "player_2", "snelle_gevalletje_klakkeloos").state;
    expect(mp(s, "player_2")).toBe(45); // -15 (Affoe) +10 (the copy)
    expect(mp(s, "player_1")).toBe(25); // +10 (Affoe) -15 (the copy)
    expect(s.players.player_2.pieciesActivatedThisTurn || 0).toBe(0);
    expect(s.players.player_1.pieciesActivatedThisTurn).toBe(1);
  });
});
