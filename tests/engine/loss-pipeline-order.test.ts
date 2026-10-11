import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { resolveMpLoss } from "../../src/engine/mp/resolveMpLoss.js";
// @ts-expect-error — JS module, no type declarations
import { LOSS_STEPS } from "../../src/engine/mp/lossSteps.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");

function build(opts: { place?: string | null; level?: number; mp?: number; status?: any[] } = {}) {
  const slot = createMosjeSlot(def, { level: opts.level ?? 2, mp: opts.mp ?? 60 });
  slot.statusEffects = opts.status ?? [];
  const state = makeEngineState({
    activePlayerId: "player_1",
    activePlace: opts.place ?? null,
    players: { player_1: { activeSlots: [slot, null] } },
  });
  return state;
}

function ctxFor(state: any, amount: number, source = "DRAIN") {
  return {
    state,
    playerId: "player_1",
    slot: state.players.player_1.activeSlots[0],
    slotIndex: 0,
    amount,
    source,
    placeId: state.activePlace,
  };
}

const halved = () => [{ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 2 }];
const reduce20 = () => [{ type: "MP_LOSS_REDUCTION", value: 20, turnsLeft: 2 }];

describe("resolveMpLoss — §2g order", () => {
  const added: Array<[string, any]> = [];
  afterEach(() => {
    for (const [key, fn] of added.splice(0)) {
      const arr = (LOSS_STEPS as any)[key];
      arr.splice(arr.indexOf(fn), 1);
    }
  });

  it("plain losses stay on the 5-grid", () => {
    expect(resolveMpLoss(ctxFor(build(), 15))).toBe(15);
    expect(resolveMpLoss(ctxFor(build(), 17)) % 5).toBe(0);
    expect(resolveMpLoss(ctxFor(build(), 0))).toBe(0);
  });

  it("Stabilizer caps 80 to 30", () => {
    expect(resolveMpLoss(ctxFor(build({ place: "place_momentum_stabilizer" }), 80))).toBe(30);
  });

  it("halved then capped: 80 under Stabilizer is 30, not 15", () => {
    const s = build({ place: "place_momentum_stabilizer", status: halved() });
    expect(resolveMpLoss(ctxFor(s, 80))).toBe(30);
  });

  it("MP_LOSS_REDUCTION 20 on a 15 loss reduces to 0", () => {
    expect(resolveMpLoss(ctxFor(build({ status: reduce20() }), 15))).toBe(0);
  });

  it("Drain Zone adds 10 to DRAIN, then Stabilizer caps", () => {
    expect(resolveMpLoss(ctxFor(build({ place: "place_drain_zone" }), 20))).toBe(30);
    expect(resolveMpLoss(ctxFor(build({ place: "place_drain_zone" }), 20, "ATTACK"))).toBe(20);
  });

  it("Drain Zone + Stabilizer: the cap is applied after the bonus", () => {
    // only one place can be active; emulate by registering the cap step on a Drain Zone state
    const s = build({ place: "place_drain_zone" });
    const cap = (c: any) => Math.min(c.amount, 30);
    LOSS_STEPS.caps.push(cap);
    added.push(["caps", cap]);
    expect(resolveMpLoss(ctxFor(s, 25))).toBe(30);
  });

  it("a pushed reducer runs after built-in reducers and before caps", () => {
    const s = build({ place: "place_momentum_stabilizer" });
    const seen: number[] = [];
    const spy = (c: any) => { seen.push(c.amount); return c.amount - 10; };
    LOSS_STEPS.reducers.push(spy);
    added.push(["reducers", spy]);
    // 80 -> (no built-in reducer applies) spy sees 80 -> 70 -> cap 30
    expect(resolveMpLoss(ctxFor(s, 80))).toBe(30);
    expect(seen).toEqual([80]);
    // 35 -> spy 25 (cap does not bite)
    expect(resolveMpLoss(ctxFor(s, 35))).toBe(25);
  });

  it("a step returning a negative or NaN never heals and stays finite on the grid", () => {
    const neg = () => -20;
    LOSS_STEPS.reducers.push(neg);
    added.push(["reducers", neg]);
    expect(resolveMpLoss(ctxFor(build(), 15))).toBe(0);
    LOSS_STEPS.reducers.splice(LOSS_STEPS.reducers.indexOf(neg), 1);
    added.pop();
    const nan = () => NaN;
    LOSS_STEPS.reducers.push(nan);
    added.push(["reducers", nan]);
    expect(resolveMpLoss(ctxFor(build(), 15))).toBe(0);
  });

  it("beforeLoss exists and is empty by default", () => {
    expect(LOSS_STEPS.beforeLoss).toEqual([]);
  });
});

describe("loseMP runs the pipeline", () => {
  it("halved + Stabilizer: an 80 loss on L2 at 60 MP leaves 30 MP", () => {
    const s = build({ place: "place_momentum_stabilizer", level: 2, mp: 60, status: halved() });
    const r = loseMP(s, "player_1", 0, 80);
    const slot = r.players.player_1.activeSlots[0];
    expect(slot.mp).toBe(30);
    expect(slot.level).toBe(2);
    expect(slot.mpLostThisTurn).toBe(30);
    expect(r.players.player_1.totalDamageTaken).toBe(30);
  });

  it("a fully reduced loss changes nothing and tracks nothing", () => {
    const s = build({ level: 2, mp: 0, status: reduce20() });
    const r = loseMP(s, "player_1", 0, 15);
    const slot = r.players.player_1.activeSlots[0];
    expect(slot.mp).toBe(0);
    expect(slot.level).toBe(2);
    expect(slot.mpLostThisTurn).toBe(0);
    expect(r.players.player_1.totalDamageTaken).toBe(0);
  });
});
