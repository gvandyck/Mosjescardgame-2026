import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { mkSlot } from "../helpers/quest56.js";
// @ts-expect-error — JS module, no type declarations
import { placeQuestBonus } from "../../src/abilities/place/placeTurnQuestEffects.js";

// Obby #1 (Obby 2.0): every Quest win gives 10 MP more, every Quest loss costs 10 MP more (any Mosje, any trait).
const run = (mp: number, win: boolean) => forceQuestResult(
  makeEngineState({ activePlace: "place_obby_1", players: { player_1: { activeSlots: [mkSlot({ mp }), null] } } }),
  "player_1", { questId: "quest_quick_thinking", win }).players.player_1.activeSlots[0].mp;

describe("Obby #1 — Quest results", () => {
  it("Quick Thinking win +25 becomes +35, loss -15 becomes -25", () => {
    expect(run(20, true)).toBe(55);
    expect(run(50, false)).toBe(25);
  });
  it("a fresh Mosje gets no bonus", () => {
    expect(placeQuestBonus({ activePlace: "place_obby_1" }, mkSlot({ entryProtected: true }), "quest_quick_thinking", true)).toBe(0);
  });
});
