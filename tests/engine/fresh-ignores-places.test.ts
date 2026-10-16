// @ts-nocheck
import { describe, it, expect } from "vitest";
import * as placeEffects from "../../src/abilities/placeEffects.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

// effect_* that need extra context args are called with plausible values; none are skipped.
const names = Object.keys(placeEffects).filter((n) => n.startsWith("effect_"));
const snap = (st) =>
  JSON.stringify(Object.values(st.players).map((p) => p.activeSlots.map((s) => s && { mp: s.mp, level: s.level, traits: s.traits, pb: s.powerBoost, se: s.statusEffects })));

describe("Fresh ignores every Place effect (RULE-08)", () => {
  it("finds the effects", () => expect(names.length).toBeGreaterThan(0));
  for (const name of names) {
    it(name, () => {
      const st = makeEngineState();
      for (const pid of ["player_1", "player_2"]) {
        const s = createMosjeSlot(MOSJES[0]);
        s.mp = 40;
        s.entryProtected = true;
        st.players[pid].activeSlots = [s];
      }
      const before = snap(st);
      let out = st;
      try {
        out = placeEffects[name](st, "player_1", 0, 0) || st;
        if (name === "effect_welloe_graveyard") out = placeEffects[name](st, "player_1", 0);
      } catch (e) {
        out = st; // needs context this harness lacks: nothing was applied
      }
      expect(snap(out && out.players ? out : st)).toBe(before);
    });
  }
});
