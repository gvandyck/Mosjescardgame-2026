import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn, endTurn, useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { canMosjeAct } from "../../src/engine/mp/canMosjeAct.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const withAbility = MOSJES.filter((m: any) => m.abilityId);
const defA = withAbility[0];
const defB = withAbility[1];

function build(active: string) {
  const a1 = createMosjeSlot(defA, { level: 1, mp: 10 });
  a1.entryProtected = false;
  const a2 = createMosjeSlot(defB, { level: 1, mp: 50 });
  a2.entryProtected = false;
  const b1 = createMosjeSlot(defA, { level: 1, mp: 10 });
  b1.entryProtected = false;
  return makeEngineState({
    activePlayerId: active,
    players: { player_1: { activeSlots: [a1, a2] }, player_2: { activeSlots: [b1, null] } },
  });
}
const p1 = (s: any, i = 0) => s.players.player_1.activeSlots[i];
const p2 = (s: any, i = 0) => s.players.player_2.activeSlots[i];

describe("sideways lifecycle (E5, decision 1)", () => {
  it("canMosjeAct: upright yes, sideways no, defeated/missing no", () => {
    expect(canMosjeAct({ sideways: false })).toBe(true);
    expect(canMosjeAct({ sideways: true })).toBe(false);
    expect(canMosjeAct({ isDefeated: true })).toBe(false);
    expect(canMosjeAct(null)).toBe(false);
  });

  it("getemt in opponent's turn: owner's next turn is sat out, stands up at its end", () => {
    let s = loseMP(build("player_1"), "player_2", 0, 20, "DRAIN");
    expect(p2(s).sideways).toBe(true);
    s = endTurn(s);
    s = startTurn(s);
    expect(s.activePlayerId).toBe("player_2");
    expect(p2(s).sideways).toBe(true);
    expect(p2(s).sidewaysArmed).toBe(true);
    const r = useMosjeAbility(s, "player_2", p2(s).cardId);
    expect(r.success).toBe(false);
    expect(r.error).toBe("This Mosje is sideways");
    s = endTurn(s);
    expect(p2(s).sideways).toBe(false);
    expect(p2(s).sidewaysArmed).toBeUndefined();
  });

  it("getemt in own turn: stays sideways through own endTurn, stands up after the following own turn", () => {
    let s = loseMP(build("player_1"), "player_1", 0, 20, "DRAIN");
    expect(p1(s).sideways).toBe(true);
    s = endTurn(s);
    expect(p1(s).sideways).toBe(true);
    expect(p1(s).sidewaysArmed).toBeUndefined();
    s = startTurn(s); // player_2
    s = endTurn(s);
    s = startTurn(s); // player_1
    expect(p1(s).sidewaysArmed).toBe(true);
    s = endTurn(s);
    expect(p1(s).sideways).toBe(false);
  });

  it("an upright Mosje of the same player can still act while another sits out", () => {
    let s = loseMP(build("player_1"), "player_1", 0, 20, "DRAIN");
    s = endTurn(s);
    s = startTurn(endTurn(startTurn(s)));
    expect(s.activePlayerId).toBe("player_1");
    expect(canMosjeAct(p1(s, 0))).toBe(false);
    expect(canMosjeAct(p1(s, 1))).toBe(true);
    const r = useMosjeAbility(s, "player_1", p1(s, 1).cardId);
    expect(r.error).not.toBe("This Mosje is sideways");
  });

  it("getemt again before standing up -> Welloe pile", () => {
    let s = loseMP(build("player_1"), "player_2", 0, 20, "DRAIN");
    s = loseMP(s, "player_2", 0, 20, "DRAIN");
    s = checkVictory(s);
    expect(s.players.player_2.welloePile.length).toBe(1);
  });

  it("V4 skipNextTurn is never set by sideways", () => {
    let s = loseMP(build("player_1"), "player_2", 0, 20, "DRAIN");
    s = startTurn(endTurn(s));
    expect(s.players.player_2.skipNextTurn).toBeFalsy();
    s = endTurn(s);
    expect(s.players.player_2.skipNextTurn).toBeFalsy();
  });

  it("player still gets Energy on the sideways turn", () => {
    let s = loseMP(build("player_1"), "player_2", 0, 20, "DRAIN");
    const before = s.players.player_2.energy;
    s = startTurn(endTurn(s));
    expect(s.players.player_2.energy).toBeGreaterThanOrEqual(before);
  });
});
