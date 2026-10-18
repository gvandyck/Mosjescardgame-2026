import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { loseMP, gainMP } from "../../src/engine/mpManager.js";
// @ts-expect-error - JS module, no type declarations
import { payStaysStartGain } from "../../src/engine/table/payStaysStartGain.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error - JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// Momentum Stabilizer (a single loss caps at 30, after reductions), Zo is Natuur (Resilient 2+ lose 10 less from attacks),
// The Void (Piecies and Snelle can't make a Mosje gain MP; losses and other gains unaffected).

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
function build(place: string | null, mp = 80, resilient = 0) {
  const s = createMosjeSlot(def, { level: 1, mp });
  s.entryProtected = false;
  s.traits = { ...s.traits, resilient };
  return makeEngineState({ activePlace: place, players: { player_1: { activeSlots: [s, null] }, player_2: { activeSlots: [null, null] } } });
}
const mp = (st: any) => st.players.player_1.activeSlots[0].mp;

describe("place_momentum_stabilizer - 40 -> 30", () => {
  it.each([["ATTACK", 40, 50], ["PIECIE", 50, 50], ["QUEST", 40, 50], ["ATTACK", 20, 60]])("%s loss of %i leaves %i", (src, amount, left) => {
    expect(mp(loseMP(build("place_momentum_stabilizer"), "player_1", 0, amount as number, src as string, false, "player_2"))).toBe(left);
  });
  it("without the Place a 40 hit takes 40", () => {
    expect(mp(loseMP(build(null), "player_1", 0, 40, "ATTACK", false, "player_2"))).toBe(40);
  });
});

describe("place_zo_is_natuur - Resilient 2+ lose 10 less from attacks", () => {
  it("Resilient 2 attacked for 30 loses 20", () => {
    expect(mp(loseMP(build("place_zo_is_natuur", 80, 2), "player_1", 0, 30, "ATTACK", false, "player_2"))).toBe(60);
  });
  it("Resilient 1 attacked for 30 loses 30; a card loss is not reduced", () => {
    expect(mp(loseMP(build("place_zo_is_natuur", 80, 1), "player_1", 0, 30, "ATTACK", false, "player_2"))).toBe(50);
    expect(mp(loseMP(build("place_zo_is_natuur", 80, 2), "player_1", 0, 30, "PIECIE", false, "player_2"))).toBe(50);
  });
});

describe("place_the_void - Piecies and Snelle can't give MP", () => {
  it.each(["PIECIE", "SNELLE"])("a %s gain gives 0", (src) => {
    expect(mp(gainMP(build("place_the_void"), "player_1", 0, 25, src))).toBe(80);
  });
  it.each(["QUEST", "ABILITY", "PLACE"])("a %s gain still works", (src) => {
    expect(mp(gainMP(build("place_the_void"), "player_1", 0, 10, src))).toBe(90);
  });
  it("losses are not blocked", () => {
    expect(mp(loseMP(build("place_the_void"), "player_1", 0, 20, "ATTACK", false, "player_2"))).toBe(60);
  });
  it("a staying Piecie's start-of-turn gain (Bowie & Stormey, Gekke Vogels) is blocked too (Gandalf 2026-10-18)", () => {
    const withEntry = (place: string | null) => {
      const st = build(place);
      st.players.player_1.piecieSlots = [{ cardId: "piecie_bowie_stormey", startGain: [{ slotIndex: 0, cardId: def.id, amount: 10 }] }, null, null];
      return st;
    };
    const blocked = payStaysStartGain(withEntry("place_the_void"), "player_1", 0);
    expect(mp(blocked)).toBe(80);
    expect(blocked.players.player_1.piecieSlots[0].startGain).toEqual([]); // still paid out once, then cleared
    expect(mp(payStaysStartGain(withEntry(null), "player_1", 0))).toBe(90);
  });
  it("a fresh Mosje ignores the Place and still gains", () => {
    const st = build("place_the_void");
    st.players.player_1.activeSlots[0].entryProtected = true;
    expect(mp(gainMP(st, "player_1", 0, 10, "PIECIE"))).toBe(90);
  });
});
