import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error — JS module
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error — JS module
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module
import { MOSJES } from "../../src/data/mosjes.js";

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
function mk(id: string, mp = 50, fresh = false) {
  const s = createMosjeSlot(def(id), { level: 1, mp });
  s.entryProtected = fresh;
  return s;
}
const game = (place: string | null, a: any, extra: any = {}) =>
  makeEngineState({ activePlace: place, players: { player_1: { activeSlots: [a, mk("mosje_jeffrey", 80)], ...extra }, player_2: { activeSlots: [mk("mosje_jeffrey", 80), null] } } });
const power = (place: string | null, id: string, extra: any = {}) => { const a = mk(id); return getPower(a, game(place, a, extra), "player_1"); };

const BULL = "mosje_alyssa_bulldozer"; // Fighting, L1 Power 20
const DIG = "mosje_ming_natural"; // Digital, L1 Power 10
const ART = "mosje_tuk_healer"; // Artistic, L1 Power 0 (a Tuk)

describe("Place Power in getPower", () => {
  it("The Gym: Fighting +10", () => { expect(power("place_the_gym", BULL)).toBe(30); expect(power("place_the_gym", DIG)).toBe(10); });
  it("Boxing Ring: Fighting +10, Gandoe +20, Digital/Artistic -10 (never below 0)", () => {
    expect(power("place_boxing_ring", BULL)).toBe(30);
    expect(power("place_boxing_ring", "mosje_gandoe_destroyer")).toBe(40);
    expect(power("place_boxing_ring", DIG)).toBe(0);
    expect(power("place_boxing_ring", ART)).toBe(0);
  });
  it("De Box: Gandoe / Michelle / Tuk +10, others +0", () => {
    expect(power("place_de_box", "mosje_michelle")).toBe(20);
    expect(power("place_de_box", ART)).toBe(10);
    expect(power("place_de_box", "mosje_gandoe_destroyer")).toBe(30);
    expect(power("place_de_box", BULL)).toBe(20);
  });
  it("Arcade: Fighting -10; Skiffa: Digital -10; Bank Chilling: all -10; Drain Zone: all +10", () => {
    expect(power("place_arcade", BULL)).toBe(10);
    expect(power("place_arcade", DIG)).toBe(10);
    expect(power("place_skiffa", DIG)).toBe(0);
    expect(power("place_skiffa", BULL)).toBe(20);
    expect(power("place_bank_chilling", BULL)).toBe(10);
    expect(power("place_drain_zone", DIG)).toBe(20);
  });
  it("Dierenasiel: -10 without a staying pet Piecie, 0 with one", () => {
    expect(power("place_dierenasiel", BULL)).toBe(10);
    const pet = { piecieSlots: [{ cardId: "piecie_vianna_poes", stays: true, faceDown: false }] };
    expect(power("place_dierenasiel", BULL, pet)).toBe(20);
  });
  it("a fresh Mosje gets no Place Power, good or bad", () => {
    for (const place of ["place_the_gym", "place_arcade", "place_bank_chilling", "place_drain_zone"]) {
      const a = mk(BULL, 50, true);
      expect(getPower(a, game(place, a), "player_1")).toBe(20);
    }
  });
  it("an attack hits for the Place-adjusted Power (Fighting 20 in The Gym takes 30)", () => {
    const s = game("place_the_gym", mk(BULL));
    const r = attackMosje(s, "player_1", { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 });
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(50);
  });
  it("Drain Zone no longer adds +10 to a DRAIN loss", () => {
    const s = game("place_drain_zone", mk(BULL));
    const after = loseMP(s, "player_2", 0, 20, "DRAIN");
    expect(after.players.player_2.activeSlots[0].mp).toBe(60);
  });
});
