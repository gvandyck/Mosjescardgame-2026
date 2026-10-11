import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error — JS module
import { canMosjeTakeAction } from "../../src/engine/actions/canMosjeTakeAction.js";
// @ts-expect-error — JS module
import { isValidAttackTarget } from "../../src/engine/actions/isValidAttackTarget.js";
// @ts-expect-error — JS module
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_alyssa_bulldozer"); // L1 Power 20
const plain = MOSJES.find((m: any) => m.id !== "mosje_alyssa_bulldozer" && m.id !== "mosje_parkour_west");

function mk(mp: number, d = plain, level = 1) {
  const s = createMosjeSlot(d, { level, mp });
  s.entryProtected = false;
  return s;
}
function build(targetMp = 50, extra: any = {}) {
  const a = mk(50, def);
  Object.assign(a, extra.attacker || {});
  const t = mk(targetMp);
  Object.assign(t, extra.target || {});
  return makeEngineState({
    ...(extra.top || {}),
    players: {
      player_1: { activeSlots: [a, mk(50)], ...(extra.p1 || {}) },
      player_2: { activeSlots: [t, mk(50)] },
    },
  });
}
const act = (s: any, o: any = {}) =>
  attackMosje(s, "player_1", { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0, ...o });

describe("attackMosje (E12)", () => {
  it("target loses attacker's Power; action is used", () => {
    const s = build(50);
    const r = act(s);
    expect(r.ok).toBe(true);
    const p = r.power;
    expect(p).toBe(20);
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(50 - p);
    const a = r.state.players.player_1.activeSlots[0];
    expect([a.actedThisTurn, a.attackedThisTurn]).toEqual([true, true]);
  });
  it("Power 0 = no loss but action used", () => {
    const s = build(50);
    s.players.player_1.activeSlots[0].powerBoost = -1000;
    const r = act(s);
    expect(r.ok).toBe(true);
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(50);
    expect(r.state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
  });
  it.each([
    ["fresh attacker", { attacker: { entryProtected: true } }],
    ["sideways attacker", { attacker: { sideways: true } }],
    ["already acted", { attacker: { actedThisTurn: true } }],
    ["cooldown turn", { p1: { cooldownTurn: true } }],
    ["fresh target", { target: { entryProtected: true } }],
    ["level-up protected target", { target: { levelUpProtected: true } }],
  ])("refuses %s with no state change", (_n, extra: any) => {
    const s = build(50, extra);
    const before = JSON.stringify(s);
    const r = act(s);
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r.state)).toBe(before);
  });
  it("refuses when not the active player", () => {
    const s = build(50);
    expect(canMosjeTakeAction(s, "player_2", 0).ok).toBe(false);
  });
  it("sideways target is allowed (E10 attack side)", () => {
    const s = build(50, { target: { sideways: true } });
    expect(isValidAttackTarget(s, "player_1", "player_2", 0)).toBe(true);
    expect(act(s).ok).toBe(true);
  });
  it("L1 target at 10 hit for 20 gets getemt (sideways)", () => {
    const s = build(10);
    const r = act(s);
    expect(r.final).toBe(20);
    const t = r.state.players.player_2.activeSlots[0];
    expect(t.sideways).toBe(true);
  });
});
