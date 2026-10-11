// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import { placeEmptyFieldMosje } from "../../src/engine/turn/placeEmptyFieldMosje.js";
import { expireThisTurnEffects } from "../../src/engine/turn/expireThisTurnEffects.js";
import { applyGainToSlot } from "../../src/engine/mp/applyGainToSlot.js";
import { getPower } from "../../src/engine/mp/getPower.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const byCost = MOSJES.filter((x) => Number.isFinite(x.cost)).sort((a, b) => a.cost - b.cost);
const cheap = byCost[0];
const dear = byCost[byCost.length - 1];
const card = (m) => ({ cardId: m.id, type: "MOSJE" });

describe("E9 — R1 empty field", () => {
  it("places the cheapest Mosje from hand free and fresh", () => {
    const st = makeEngineState();
    st.players.player_1.hand = [card(dear), card(cheap)];
    const { placedSlotIndex } = placeEmptyFieldMosje(st, "player_1");
    const p = st.players.player_1;
    expect(placedSlotIndex).toBe(0);
    expect(p.activeSlots[0].cardId).toBe(cheap.id);
    expect(p.activeSlots[0].level).toBe(1);
    expect(p.activeSlots[0].entryProtected).toBe(true);
    expect(p.hand).toEqual([card(dear)]);
    expect(p.energy).toBe(6);
  });

  it("falls back to the deck and shuffles it", () => {
    const st = makeEngineState();
    st.players.player_1.deck = [card(dear), card(cheap)];
    const shuffle = vi.fn((d) => d);
    placeEmptyFieldMosje(st, "player_1", shuffle);
    expect(shuffle).toHaveBeenCalledTimes(1);
    expect(st.players.player_1.activeSlots[0].cardId).toBe(cheap.id);
    expect(st.players.player_1.deck).toHaveLength(1);
  });

  it("does nothing when the field has a Mosje or no Mosje exists anywhere", () => {
    const st = makeEngineState();
    st.players.player_1.activeSlots[0] = createMosjeSlot(cheap);
    st.players.player_1.hand = [card(dear)];
    expect(placeEmptyFieldMosje(st, "player_1").placedSlotIndex).toBe(-1);
    expect(st.players.player_1.hand).toHaveLength(1);
    expect(placeEmptyFieldMosje(makeEngineState(), "player_2").placedSlotIndex).toBe(-1);
  });
});

describe("level-up flag and this-turn effects", () => {
  it("crossing 100 sets levelUpProtected", () => {
    const slot = createMosjeSlot(cheap, { mp: 95 });
    applyGainToSlot(slot, 5, { turnNumber: 1 });
    expect(slot.level).toBe(2);
    expect(slot.levelUpProtected).toBe(true);
  });

  it("powerBoostThisTurn counts in getPower and expires at end of turn", () => {
    const st = makeEngineState();
    const slot = createMosjeSlot(cheap);
    st.players.player_2.activeSlots[1] = slot;
    const base = getPower(slot);
    slot.powerBoostThisTurn = 20;
    slot.immuneThisTurn = true;
    expect(getPower(slot)).toBe(base + 20);
    expireThisTurnEffects(st);
    expect(getPower(slot)).toBe(base);
    expect(slot.immuneThisTurn).toBe(false);
  });
});
