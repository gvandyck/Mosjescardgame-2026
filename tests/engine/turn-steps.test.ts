// @ts-nocheck
import { describe, it, expect } from "vitest";
import { startTurn, endTurn } from "../../src/engine/turnManager.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { pushTestDice } from "../../src/engine/dice/testDiceQueue.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const m = MOSJES[0];
const card = { cardId: m.id, type: "MOSJE" };
const filler = { cardId: "piecie_x", type: "PIECIE" };

describe("2.0 turn steps", () => {
  it("R1 Mosje stays fresh; a Mosje fresh before the turn is cleared", () => {
    const st = makeEngineState();
    st.players.player_2.activeSlots[0] = createMosjeSlot(m);
    st.players.player_1.hand = [card];
    const out = startTurn(st);
    expect(out.players.player_1.activeSlots[0].entryProtected).toBe(true);

    const st2 = makeEngineState();
    st2.players.player_2.activeSlots[0] = createMosjeSlot(m); // opponent must have a Mosje or checkLoss ends the game
    st2.players.player_1.activeSlots[0] = createMosjeSlot(m);
    st2.players.player_1.deck = [filler];
    const out2 = startTurn(st2);
    expect(out2.players.player_1.activeSlots[0].entryProtected).toBeUndefined();
  });

  it("levelUpProtected clears for the active player only", () => {
    const st = makeEngineState();
    st.players.player_1.activeSlots[0] = { ...createMosjeSlot(m), levelUpProtected: true };
    st.players.player_2.activeSlots[0] = { ...createMosjeSlot(m), levelUpProtected: true };
    st.players.player_1.deck = [filler];
    const out = startTurn(st);
    expect(out.players.player_1.activeSlots[0].levelUpProtected).toBeUndefined();
    expect(out.players.player_2.activeSlots[0].levelUpProtected).toBe(true);
  });

  it("no MP at turn start (no trickle)", () => {
    const st = makeEngineState();
    st.players.player_2.activeSlots[0] = createMosjeSlot(m);
    st.players.player_1.activeSlots[0] = createMosjeSlot(m, { mp: 20 });
    st.players.player_1.deck = [filler];
    pushTestDice([3]); // Chaos Roll at turn start (Gandoe Wizard): 3-4 = nothing
    expect(startTurn(st).players.player_1.activeSlots[0].mp).toBe(20);
  });

  it("endTurn clears powerBoostThisTurn on both players", () => {
    const st = makeEngineState();
    st.players.player_1.activeSlots[0] = { ...createMosjeSlot(m), powerBoostThisTurn: 10 };
    st.players.player_2.activeSlots[0] = { ...createMosjeSlot(m), powerBoostThisTurn: 10 };
    const out = endTurn(st);
    expect(out.players.player_1.activeSlots[0].powerBoostThisTurn).toBeUndefined();
    expect(out.players.player_2.activeSlots[0].powerBoostThisTurn).toBeUndefined();
  });
});
