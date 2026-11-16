import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { advanceQuestStack } from "../../src/engine/quests/advanceQuestStack.js";

// 70-02 (rules §6): one attempt, win or fail, shuffles the Quest back and turns one up. The fuller cases live in quest-roll-and-stack-2-1.test.ts.
const mk = (s: any) => ({ questStacks: { PHYSICAL: s } });
const rev = (a: string[]) => [...a].reverse();

describe("advanceQuestStack (E17 unit)", () => {
  it("a fail puts the Quest back and turns up the shuffled top, no token", () => {
    const st = advanceQuestStack(mk({ deck: ["b"], faceUp: "a", discard: [] }), "PHYSICAL", "fail", rev);
    expect(st.questStacks.PHYSICAL).toEqual({ deck: ["b"], faceUp: "a", discard: [] }); // [b,a] reversed = [a,b]; a turned up
  });
  it("a win does the same", () => {
    const st = advanceQuestStack(mk({ deck: ["b", "c"], faceUp: "a", discard: [] }), "PHYSICAL", "win", rev);
    expect(st.questStacks.PHYSICAL).toEqual({ deck: ["c", "b"], faceUp: "a", discard: [] }); // [b,c,a] reversed = [a,c,b]
  });
  it("the shuffle gets the old face-up Quest too", () => {
    let seen: string[] = [];
    advanceQuestStack(mk({ deck: ["x", "y"], faceUp: "a", discard: [] }), "PHYSICAL", "win", (c: string[]) => { seen = [...c]; return c; });
    expect(seen.sort()).toEqual(["a", "x", "y"]);
  });
});
