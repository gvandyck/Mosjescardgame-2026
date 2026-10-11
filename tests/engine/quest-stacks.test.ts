import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { advanceQuestStack } from "../../src/engine/quests/advanceQuestStack.js";

const mk = (s: any) => ({ questStacks: { FIGHTING: s } });
const rev = (a: string[]) => [...a].reverse();

describe("advanceQuestStack (E17 unit)", () => {
  it("first fail adds a token", () => {
    const st = advanceQuestStack(mk({ deck: ["b"], faceUp: "a", tokens: 0, discard: [] }), "FIGHTING", "fail");
    expect(st.questStacks.FIGHTING).toEqual({ deck: ["b"], faceUp: "a", tokens: 1, discard: [] });
  });
  it("second fail discards and turns next", () => {
    const st = advanceQuestStack(mk({ deck: ["b", "c"], faceUp: "a", tokens: 1, discard: [] }), "FIGHTING", "fail");
    expect(st.questStacks.FIGHTING).toEqual({ deck: ["c"], faceUp: "b", tokens: 0, discard: ["a"] });
  });
  it("win replaces at once", () => {
    const st = advanceQuestStack(mk({ deck: ["b"], faceUp: "a", tokens: 1, discard: ["z"] }), "FIGHTING", "win");
    expect(st.questStacks.FIGHTING).toEqual({ deck: [], faceUp: "b", tokens: 0, discard: ["z", "a"] });
  });
  it("empty deck reshuffles own discards incl. old Quest", () => {
    const st = advanceQuestStack(mk({ deck: [], faceUp: "a", tokens: 0, discard: ["x", "y"] }), "FIGHTING", "win", rev);
    expect(st.questStacks.FIGHTING).toEqual({ deck: ["x", "a"], faceUp: "y", tokens: 0, discard: [] });
  });
});
