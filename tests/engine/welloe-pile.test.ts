// TABLE-06 — Welloe pile exit rule (Phase 57-03)
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error — JS modules
import { effect_mosje_reborn, effect_call_of_welloes } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const entry = { cardId: "mosje_jeffrey", name: "Jeffrey", type: "MOSJE", source: "welloe", level: 1, mp: 50, statusEffects: [], isDefeated: true, traits: {} };
function make(place: string | null) {
  const st = makeEngineState();
  st.activePlace = place;
  st.players.player_1.welloePile = [{ ...entry }];
  st.players.player_1.activeSlots = [null, null];
  return st;
}

describe("Welloe pile exit (TABLE-06)", () => {
  it("under Welloe Graveyard both cards leave pile and field unchanged (and ask nothing)", () => {
    const s = make("place_welloe_graveyard");
    for (const fn of [effect_mosje_reborn, effect_call_of_welloes]) {
      const r = fn(s, "player_1", { slotIndex: 0 });
      expect(r.needChoice).toBeUndefined();
      expect(r.players.player_1.welloePile).toHaveLength(1);
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
      expect(r.players.player_1.welloePile).toHaveLength(0);
      expect(r.players.player_1.activeSlots.some((x: any) => x?.cardId === "mosje_jeffrey")).toBe(true);
    }
  });

  it("deck-out reshuffle uses the graveyard only; Welloe pile length unchanged", () => {
    const st = makeEngineState();
    for (const id of ["player_1", "player_2"]) st.players[id].activeSlots = [createMosjeSlot(MOSJES[0]), null];
    const p = st.players.player_1;
    p.deck = []; p.graveyard = ["a", "b"]; p.welloePile = ["w1", "w2"];
    const s = startTurn(st).players.player_1;
    expect([...s.deck, ...s.hand].sort()).toEqual(["a", "b"]);
    expect(s.welloePile).toHaveLength(2);
  });

  it("static: only the sanctioned files write welloePile", () => {
    const SRC = join(__dirname, "..", "..", "src");
    const ALLOWED = ["victoryChecker.js", "gameState.js", "piecieEffects.js", "turnManager.js", "summonFromWelloe.js", "callMosjeBackToWelloe.js"];
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      if (statSync(p).isDirectory()) return n === "data" ? [] : walk(p);
      return p.endsWith(".js") ? [p] : [];
    });
    const hits: string[] = [];
    for (const f of walk(SRC)) {
      if (ALLOWED.some((a) => f.endsWith(a))) continue;
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        const i2 = line.indexOf("//");
        const code = i2 >= 0 ? line.slice(0, i2) : line;
        if (/welloePile\s*(=[^=]|\.(splice|push|pop|shift|unshift)\()/.test(code)) hits.push(`${f}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
