import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { advanceQuestStack } from "../../src/engine/quests/advanceQuestStack.js";

const mk = (s: any) => ({ questStacks: { PHYSICAL: s } });
const rev = (a: string[]) => [...a].reverse();

describe("advanceQuestStack (E17 unit)", () => {
  it("first fail adds a token", () => {
    const st = advanceQuestStack(mk({ deck: ["b"], faceUp: "a", tokens: 0, discard: [] }), "PHYSICAL", "fail");
    expect(st.questStacks.PHYSICAL).toEqual({ deck: ["b"], faceUp: "a", tokens: 1, discard: [] });
  });
  it("second fail discards and turns next", () => {
    const st = advanceQuestStack(mk({ deck: ["b", "c"], faceUp: "a", tokens: 1, discard: [] }), "PHYSICAL", "fail");
    expect(st.questStacks.PHYSICAL).toEqual({ deck: ["c"], faceUp: "b", tokens: 0, discard: ["a"] });
  });
  it("win replaces at once", () => {
    const st = advanceQuestStack(mk({ deck: ["b"], faceUp: "a", tokens: 1, discard: ["z"] }), "PHYSICAL", "win");
    expect(st.questStacks.PHYSICAL).toEqual({ deck: [], faceUp: "b", tokens: 0, discard: ["z", "a"] });
  });
  it("empty deck reshuffles own discards incl. old Quest", () => {
    const st = advanceQuestStack(mk({ deck: [], faceUp: "a", tokens: 0, discard: ["x", "y"] }), "PHYSICAL", "win", rev);
    expect(st.questStacks.PHYSICAL).toEqual({ deck: ["y", "x"], faceUp: "a", tokens: 0, discard: [] });
  });
});
