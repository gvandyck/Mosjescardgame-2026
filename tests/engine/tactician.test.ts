// E26 — The Tactician (Card List 2.0): "once per turn, pay 2 Energy: choose one Mosje (yours or an opponent's) and set
// its MP to any value from 10 to 75 until the end of the turn. Any MP it gains or loses this turn is kept: at the end
// of the turn it goes back to its old MP plus those gains and losses." Ruling: the set ends early on level-up / getemt.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility, endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { gainMP, loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName } from "../helpers/quest56.js";

const TAC = byName(/The Tactician/);

function board(mp = 20, level = 1) {
  return makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { energy: 4, activeSlots: [mkSlot({ mp, level }, TAC), mkSlot({ mp: 30 })] },
      player_2: { activeSlots: [mkSlot({ mp: 40 }), null] },
    },
  });
}
function set(s: any, value: number, target = { playerId: "player_1", slotIndex: 0 }) {
  s._pendingTargets = { target, mp: value };
  return useMosjeAbility(s, "player_1", TAC.id);
}
const mp = (s: any, pid = "player_1", i = 0) => s.players[pid].activeSlots[i].mp;

describe("E26 The Tactician: set", () => {
  it("E26 sets an own Mosje to 45 and pays 2 Energy", () => {
    const res = set(board(), 45);
    expect(res.success).toBe(true);
    expect(mp(res.state)).toBe(45);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("E26 sets a non-fresh opponent Mosje", () => {
    const res = set(board(), 75, { playerId: "player_2", slotIndex: 0 });
    expect(res.success).toBe(true);
    expect(mp(res.state, "player_2")).toBe(75);
  });

  it("E26 refuses 5, 80 and 42 and pays nothing", () => {
    for (const v of [5, 80, 42]) {
      const s = board();
      const res = set(s, v);
      expect(res.success).toBe(false);
      expect(res.state.players.player_1.energy).toBe(4);
      expect(mp(res.state)).toBe(20);
    }
  });

  it("E26 refuses a fresh opponent Mosje", () => {
    const s = board();
    s.players.player_2.activeSlots[0].entryProtected = true;
    const res = set(s, 45, { playerId: "player_2", slotIndex: 0 });
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(4);
    expect(mp(res.state, "player_2")).toBe(40);
  });
});

describe("E26 The Tactician: snap-back", () => {
  it("E26 real 20, set 75, gains 15 -> shows 90; end of turn -> 35", () => {
    let s = set(board(20), 75).state;
    s = gainMP(s, "player_1", 0, 15, "GAIN");
    expect(mp(s)).toBe(90);
    s = endTurn(s);
    expect(mp(s)).toBe(35);
    expect(s.players.player_1.activeSlots[0].level).toBe(1);
    expect(s.players.player_1.activeSlots[0].tacticianSet).toBeUndefined();
  });

  it("E26 set 10, loses 5 -> 5; end of turn -> 20 - 5 = 15", () => {
    let s = set(board(20), 10).state;
    s = loseMP(s, "player_1", 0, 5, "ABILITY", false, "player_2");
    expect(mp(s)).toBe(5);
    s = endTurn(s);
    expect(mp(s)).toBe(15);
  });

  it("E26 a plain set with no gains goes straight back to the real MP", () => {
    let s = set(board(20), 60).state;
    s = endTurn(s);
    expect(mp(s)).toBe(20);
  });

  it("E26 the set itself never levels up (75 stays level 1)", () => {
    const s = set(board(20), 75).state;
    expect(s.players.player_1.activeSlots[0].level).toBe(1);
  });
});

describe("E26 The Tactician: getemt and level-up end the set early", () => {
  it("E26 real 60 L2, set 10, loses 10 -> getemt works (L1, 50 MP) and no snap-back on top", () => {
    let s = set(board(60, 2), 10).state;
    s = loseMP(s, "player_1", 0, 10, "ABILITY", false, "player_2");
    const slot = s.players.player_1.activeSlots[0];
    expect(slot.level).toBe(1);
    expect(slot.mp).toBe(50);
    expect(slot.tacticianSet).toBeUndefined();
    s = endTurn(s);
    expect(mp(s)).toBe(50);
    expect(s.players.player_1.activeSlots[0].level).toBe(1);
  });

  it("E26 a gain from the set that reaches 100 levels up for real and ends the set", () => {
    let s = set(board(20), 75).state;
    s = gainMP(s, "player_1", 0, 30, "GAIN");
    const slot = s.players.player_1.activeSlots[0];
    expect(slot.level).toBe(2);
    expect(slot.tacticianSet).toBeUndefined();
    s = endTurn(s);
    expect(s.players.player_1.activeSlots[0].level).toBe(2);
  });
});
