// TABLE-06 — Welloe pile exit rule (Phase 57-03)
import { describe, expect, it } from "vitest";
import { fallen } from "../helpers/fallen.js";
// @ts-expect-error — JS modules
import { effect_mosje_reborn, effect_call_of_welloes } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const entry = { cardId: "mosje_jeffrey", name: "Jeffrey", type: "MOSJE", source: "welloe" };
function make(place: string | null) {
  const st = makeEngineState();
  st.activePlace = place;
  st.players.player_1.graveyard = [{ ...entry }];
  st.players.player_1.activeSlots = [null, null];
  return st;
}

describe("Welloe pile exit (TABLE-06)", () => {
  it("under Welloe Graveyard both cards leave pile and field unchanged (and ask nothing)", () => {
    const s = make("place_welloe_graveyard");
    for (const fn of [effect_mosje_reborn, effect_call_of_welloes]) {
      const r = fn(s, "player_1", { slotIndex: 0 });
      expect(r.needChoice).toBeUndefined();
      expect(fallen(r.players.player_1)).toHaveLength(1);
      expect(r.players.player_1.activeSlots).toEqual([null, null]);
    }
  });

  it("without that Place both pause for the pick, then take that Mosje out", () => {
    for (const fn of [effect_mosje_reborn, effect_call_of_welloes]) {
      const asked = fn(make(null), "player_1", { slotIndex: 0 });
      expect(asked.needChoice.options).toHaveLength(1);
      const st = asked.state;
      st.players.player_1._pendingTargets = { [asked.needChoice.key]: asked.needChoice.options[0] };
      const r = fn(st, "player_1", { slotIndex: 0 });
      expect(fallen(r.players.player_1)).toHaveLength(0);
      expect(r.players.player_1.activeSlots.some((x: any) => x?.cardId === "mosje_jeffrey")).toBe(true);
    }
  });

  it("deck-out reshuffles the discarded cards only; the Mosjes stay in the one pile", () => {
    const st = makeEngineState();
    for (const id of ["player_1", "player_2"]) st.players[id].activeSlots = [createMosjeSlot(MOSJES[0]), null];
    const p = st.players.player_1;
    p.deck = [];
    p.graveyard = [{ cardId: "a", type: "PIECIE" }, { ...entry }, { cardId: "b", type: "PIECIE" }, { ...entry, cardId: "mosje_binti" }];
    const s = startTurn(st).players.player_1;
    expect([...s.deck, ...s.hand].map((c: any) => c.cardId).sort()).toEqual(["a", "b"]);
    expect(s.graveyard.map((c: any) => c.cardId)).toEqual(["mosje_jeffrey", "mosje_binti"]);
  });
});
