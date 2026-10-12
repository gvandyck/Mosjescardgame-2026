// @ts-nocheck
// E19 / E10 (jab side) - Quest win jab.
import { describe, it, expect } from "vitest";
import { build, finish, mkSlot } from "../helpers/quest56.js";
import { getJabTargets } from "../../src/engine/quests/getJabTargets.js";

const opp1 = (s) => s.players.player_2.activeSlots[0];
const T = { playerId: "player_2", slotIndex: 0 };

describe("Quest jab (E19)", () => {
  it("Sustained Assault win: target 40 -> 30", () => {
    const { s, q } = build("sustained_assault");
    expect(opp1(finish(s, q, true, { jabTarget: T })).mp).toBe(30);
  });
  it("jab at 10 MP at L1 getemts the target", () => {
    const { s, q } = build("sustained_assault", { opp: [mkSlot({ mp: 10 }), null] });
    expect(opp1(finish(s, q, true, { jabTarget: T })).sideways).toBe(true);
  });
  it("jab on a L2 Mosje at 5 MP drops it to L1 at 50", () => {
    const { s, q } = build("sustained_assault", { opp: [mkSlot({ mp: 5, level: 2 }), null] });
    const t = opp1(finish(s, q, true, { jabTarget: T }));
    expect([t.level, t.mp]).toEqual([1, 50]);
  });
  it("fresh target is not targetable and loses nothing", () => {
    const { s, q } = build("sustained_assault", { opp: [mkSlot({ mp: 40, entryProtected: true }), null] });
    expect(getJabTargets(s, "player_1", q.id)).toEqual([]);
    expect(opp1(finish(s, q, true, { jabTarget: T })).mp).toBe(40);
  });
  it("a level-up-protected target is hit by the jab", () => {
    const { s, q } = build("sustained_assault", { opp: [mkSlot({ mp: 40, levelUpProtected: true }), null] });
    expect(opp1(finish(s, q, true, { jabTarget: T })).mp).toBe(30);
  });
  it("Tough It Out has no jab", () => {
    const { s, q } = build("tough_it_out");
    expect(opp1(finish(s, q, true, { jabTarget: T })).mp).toBe(40);
  });
  it("Late Night Questing skips Digital targets", () => {
    const { s, q } = build("late_night_questing", { opp: [mkSlot({ mp: 40, subtype: "DIGITAL" }), mkSlot({ mp: 40, subtype: "FIGHTING" })] });
    expect(getJabTargets(s, "player_1", q.id)).toEqual([{ playerId: "player_2", slotIndex: 1 }]);
  });
  it("Shotje Obby only allows the highest-MP target", () => {
    const { s, q } = build("shotje_obby", { opp: [mkSlot({ mp: 40 }), mkSlot({ mp: 60 })] });
    expect(getJabTargets(s, "player_1", q.id)).toEqual([{ playerId: "player_2", slotIndex: 1 }]);
    const out = finish(s, q, true, { jabTarget: T });
    expect(opp1(out).mp).toBe(40);
    expect(out.players.player_2.activeSlots[1].mp).toBe(50);
  });
  it("Larry Temmen jabs only when Larry / Zegeltje was discarded", () => {
    const { s, q } = build("larry_temmen");
    expect(opp1(finish(s, q, true, { jabTarget: T })).mp).toBe(40);
    expect(opp1(finish(s, q, true, { jabTarget: T }, { discardedCardIds: ["piecie_larry_zegeltje"] })).mp).toBe(30);
  });
  it("no valid target: the win still resolves", () => {
    const { s, q } = build("regelaar", { opp: [null, null] });
    expect(finish(s, q, true).players.player_1.activeSlots[0].mp).toBe(65);
  });
});
