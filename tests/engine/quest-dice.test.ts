import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";
// @ts-expect-error — JS module
import { rollQuestDice } from "../../src/engine/quests/rollQuestDice.js";

const arm = { rollTrait: "physical", band: "skilled" };
const mk = (place: string | null = null, extra = 0, snelle = 0) => ({
  activePlace: place,
  _snelleFlags: snelle ? { questDiceBonus: snelle } : undefined,
  players: { p1: { questExtraDice: extra } },
});
const slot = (traits: Record<string, number>, name = "Test", fresh = false) => ({ name, traits, entryProtected: fresh });

describe("getQuestDiceCount (E15)", () => {
  it("dice = stars of rollTrait", () => expect(getQuestDiceCount(mk(), "p1", slot({ physical: 3 }), arm)).toBe(3));
  it("missing trait -> 1", () => expect(getQuestDiceCount(mk(), "p1", slot({}), arm)).toBe(1));
  it("best trait", () => expect(getQuestDiceCount(mk(), "p1", slot({ physical: 2, social: 3 }), { rollTrait: "best", band: "steady" })).toBe(3));
  it("none -> 1", () => expect(getQuestDiceCount(mk(), "p1", slot({ physical: 3 }), { rollTrait: "none", band: "coin_flip" })).toBe(1));
  it("cap at 4 with Gym + Piecie die", () => expect(getQuestDiceCount(mk("place_the_gym", 1), "p1", slot({ physical: 3 }), arm)).toBe(4));
  it("4 stars + Arcade on Technical stays 4", () => expect(getQuestDiceCount(mk("place_arcade"), "p1", slot({ technical: 4 }), { rollTrait: "technical", band: "steady" })).toBe(4));
  it("Gym gives +1 on Physical", () => expect(getQuestDiceCount(mk("place_the_gym"), "p1", slot({ physical: 1 }), arm)).toBe(2));
  it("fresh Mosje gets no Place die", () => expect(getQuestDiceCount(mk("place_the_gym"), "p1", slot({ physical: 1 }, "T", true), arm)).toBe(1));
  it("Coert + Tesla +1 on any Quest", () => expect(getQuestDiceCount(mk("place_tesla"), "p1", slot({ social: 1 }, "Coert Kasteluck"), { rollTrait: "social", band: "steady" })).toBe(2));
  it("snelle flag and extra added before cap", () => {
    expect(getQuestDiceCount(mk(null, 0, 1), "p1", slot({ physical: 1 }), arm)).toBe(2);
    expect(getQuestDiceCount(mk(), "p1", slot({ physical: 3 }), arm, { extra: 5 })).toBe(4);
  });
});

describe("rollQuestDice", () => {
  it("uses floor(rng*6)+1", () => {
    const seq = [0, 0.5, 0.999];
    let i = 0;
    expect(rollQuestDice(3, () => seq[i++])).toEqual([1, 4, 6]);
  });
});
