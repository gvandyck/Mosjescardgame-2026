// @ts-nocheck
import { describe, it, expect } from "vitest";
import { loseMP } from "../../src/engine/mpManager.js";
import { isFresh } from "../../src/engine/fresh/isFresh.js";
import { isOpponentSourced } from "../../src/engine/fresh/isOpponentSourced.js";
import { getOpponentMosjes } from "../../src/engine/gameState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

function board(active: string, freshP2 = true) {
  const st = makeEngineState();
  st.activePlayerId = active;
  for (const pid of ["player_1", "player_2"]) {
    const s = createMosjeSlot(MOSJES[0]);
    s.mp = 40;
    delete s.entryProtected;
    st.players[pid].activeSlots = [s];
  }
  if (freshP2) st.players.player_2.activeSlots[0].entryProtected = true;
  return st;
}
const mp = (st) => st.players.player_2.activeSlots[0].mp;

describe("Fresh (RULE-08) loss guard", () => {
  it("helpers", () => {
    expect(isFresh({ entryProtected: true })).toBe(true);
    expect(isFresh({})).toBe(false);
    expect(isOpponentSourced({ activePlayerId: "a" }, "b", undefined)).toBe(true);
    expect(isOpponentSourced({ activePlayerId: "b" }, "b", "a")).toBe(true);
    expect(isOpponentSourced({ activePlayerId: "a" }, "b", "b")).toBe(false);
  });
  it("opponent Snelle on the owner's own turn fizzles (byPlayerId)", () => {
    const st = board("player_2");
    expect(mp(loseMP(st, "player_2", 0, 10, "DRAIN", false, "player_1"))).toBe(40);
  });
  it("opponent turn without byPlayerId fizzles (inferred)", () => {
    expect(mp(loseMP(board("player_1"), "player_2", 0, 10, "DRAIN"))).toBe(40);
  });
  it("own loss applies, also with a COST label", () => {
    expect(mp(loseMP(board("player_2"), "player_2", 0, 10, "DRAIN", false, "player_2"))).toBe(30);
    expect(mp(loseMP(board("player_2"), "player_2", 0, 10, "QUEST_COST"))).toBe(30);
  });
  it("non-fresh Mosje takes the loss", () => {
    expect(mp(loseMP(board("player_1", false), "player_2", 0, 10, "DRAIN"))).toBe(30);
  });
  it("getOpponentMosjes marks fresh as protected", () => {
    const list = getOpponentMosjes(board("player_1"), "player_1");
    expect(list[0].protected).toBe(true);
  });
});
