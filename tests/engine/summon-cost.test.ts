// @ts-nocheck
// E2 - Obby 2.0 TABLE-01: summoning costs Energy.
import { describe, it, expect } from "vitest";
import { playMosje } from "../../src/engine/turnManager.js";
import { createInitialGameState } from "../../src/engine/gameState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const three = MOSJES.find((m) => m.cost === 3);
const other = MOSJES.filter((m) => m.cost === 3)[1] ?? MOSJES.find((m) => m.id !== three.id);
const ref = { cardId: three.id, type: "MOSJE" };

function setup(energy) {
  const st = makeEngineState();
  st.players.player_1.hand = [ref];
  st.players.player_1.energy = energy;
  return st;
}

describe("E2 - summon cost", () => {
  it("Energy 5, cost 3: summons, pays 3, arrives fresh at Level 1", () => {
    const r = playMosje(setup(5), "player_1", { cardId: three.id });
    expect(r.success).toBe(true);
    const p = r.state.players.player_1;
    expect(p.energy).toBe(2);
    expect(p.activeSlots[r.slotIndex].entryProtected).toBe(true);
    expect(p.activeSlots[r.slotIndex].level).toBe(1);
    expect(p.hand).toHaveLength(0);
  });

  it("Energy 2, cost 3: refused, hand and Energy unchanged", () => {
    const r = playMosje(setup(2), "player_1", { cardId: three.id });
    expect(r.success).toBe(false);
    expect(r.error).toBe("Not enough Energy");
    expect(r.state.players.player_1.hand).toEqual([ref]);
    expect(r.state.players.player_1.energy).toBe(2);
  });

  it("not your turn: refused", () => {
    const st = setup(6);
    st.activePlayerId = "player_2";
    expect(playMosje(st, "player_1", { cardId: three.id }).success).toBe(false);
  });

  it("third Mosje with two on the field: refused, Energy untouched", () => {
    const st = setup(6);
    st.players.player_1.activeSlots = [createMosjeSlot(other), createMosjeSlot(other)];
    const r = playMosje(st, "player_1", { cardId: three.id });
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.energy).toBe(6);
  });

  it("the setup Mosje was free: Energy starts at 2 with a Mosje already on the field", () => {
    const st = createInitialGameState(
      [{ playerId: "p1", name: "A", deckId: "DIGITAL_CONTROL" }, { playerId: "p2", name: "B", deckId: "PHYSICAL_FORCE" }],
      "T",
      { firstPlayerId: "p1" },
    );
    expect(st.players.p1.energy).toBe(2);
    expect(st.players.p1.activeSlots.filter(Boolean)).toHaveLength(1);
  });
});
