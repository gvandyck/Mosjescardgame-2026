import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error — JS module
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error — JS module
import { expireThisTurnEffects } from "../../src/engine/turn/expireThisTurnEffects.js";
// @ts-expect-error — JS module
import { MOSJES } from "../../src/data/mosjes.js";

const byId = (id: string) => MOSJES.find((m: any) => m.id === id);
const bull = byId("mosje_alyssa_bulldozer");
const flow = byId("mosje_parkour_west");
const plain = MOSJES.find((m: any) => !["mosje_alyssa_bulldozer", "mosje_parkour_west"].includes(m.id));

function mk(def: any, mp = 50, boost = 0, extra: any = {}) {
  const s = createMosjeSlot(def, { level: 1, mp });
  s.entryProtected = false;
  s.powerBoost = boost;
  return Object.assign(s, extra);
}
function game(att: any, tgt: any, top: any = {}) {
  return makeEngineState({
    ...top,
    players: { player_1: { activeSlots: [att, mk(plain)] }, player_2: { activeSlots: [tgt, mk(plain)] } },
  });
}
const hit = (s: any) =>
  attackMosje(s, "player_1", { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 });
const t0 = (s: any) => s.players.player_2.activeSlots[0];
const a0 = (s: any) => s.players.player_1.activeSlots[0];
// Alyssa L1 has Power 20; boost reaches exact amounts.
const attacker = (power: number) => mk(plain, 50, power - getPower(mk(plain)));

describe("attack triggers", () => {
  it("Flow: 30 hit loses 10; second 30 same turn loses 30", () => {
    const r1 = hit(game(attacker(30), mk(flow, 80)));
    expect(t0(r1.state).mp).toBe(70);
    const s2 = r1.state;
    s2.players.player_1.activeSlots[0].actedThisTurn = false;
    expect(t0(hit(s2).state).mp).toBe(40);
  });
  it("Unstoppable: 20 then 10 -> +25 MP and +10 Power once; lasts through owner's next turn", () => {
    let s = game(attacker(20), mk(bull, 50));
    s = hit(s).state;
    expect(t0(s).mp).toBe(30);
    a0(s).actedThisTurn = false; a0(s).powerBoost = 10 - getPower(mk(plain)); // attacker Power now 10
    s = hit(s).state;
    expect(t0(s).mp).toBe(20 + 25);
    expect(t0(s).powerBoostUntilOwnerTurnEnd).toEqual({ amount: 10, ownerId: "player_2" });
    expect(getPower(t0(s))).toBe(getPower(mk(bull)) + 10);
    // end of attacker's turn: boost survives
    s.activePlayerId = "player_1";
    expireThisTurnEffects(s);
    expect(getPower(t0(s))).toBe(getPower(mk(bull)) + 10);
    // end of owner's turn: gone
    s.activePlayerId = "player_2";
    expireThisTurnEffects(s);
    expect(getPower(t0(s))).toBe(getPower(mk(bull)));
  });
  it("Welloe Force: attacker loses 15", () => {
    const s = game(attacker(10), mk(plain, 50), { _welloeForceActive: { ownerId: "player_2" } });
    const r = hit(s);
    expect(a0(r.state).mp).toBe(35);
  });
  it("Momentum Diefje: gains 20 when loss > 0, nothing at 0", () => {
    const s1 = game(attacker(10), mk(plain, 50)); a0(s1).momentumDiefjeThisTurn = true;
    const r = hit(s1);
    expect(a0(r.state).mp).toBe(70);
    const s0 = game(attacker(0), mk(plain, 50)); a0(s0).momentumDiefjeThisTurn = true;
    expect(a0(hit(s0).state).mp).toBe(50);
  });
  it("MP Hemorrhage: first target marked, arm cleared", () => {
    const s = game(attacker(10), mk(plain, 50)); a0(s).mpHemorrhageArmed = true;
    const r = hit(s);
    expect(t0(r.state).hemorrhageMark).toEqual({ byPlayerId: "player_1" });
    expect(a0(r.state).mpHemorrhageArmed).toBe(false);
  });
  it("Zo is Natuur: attack -10 for Resilient 2+, other losses and Resilient 1 unchanged", () => {
    const res2 = mk(plain, 80); res2.traits = { ...res2.traits, resilient: 2 };
    const r = hit(game(attacker(30), res2, { activePlace: "place_zo_is_natuur" }));
    expect(t0(r.state).mp).toBe(80 - 20);
    const res1 = mk(plain, 80); res1.traits = { ...res1.traits, resilient: 1 };
    expect(t0(hit(game(attacker(30), res1, { activePlace: "place_zo_is_natuur" })).state).mp).toBe(50);
  });
  it("Momentum Stabilizer: attack 40 -> 30", () => {
    const r = hit(game(attacker(40), mk(plain, 80), { activePlace: "place_momentum_stabilizer" }));
    expect(t0(r.state).mp).toBe(50);
  });
});
