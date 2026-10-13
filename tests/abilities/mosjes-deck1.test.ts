import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { runMosjeTriggers } from "../../src/engine/mosje/runMosjeTriggers.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { pushTestDice, clearTestDice } from "../../src/engine/dice/testDiceQueue.js";
// @ts-expect-error - JS module
import { getPower } from "../../src/engine/mp/getPower.js";
// @ts-expect-error - JS module
import { expireThisTurnEffects } from "../../src/engine/turn/expireThisTurnEffects.js";
// @ts-expect-error - JS module
import { useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { build, finish, mkSlot, byName } from "../helpers/quest56.js";

afterEach(() => clearTestDice());

const hand = (...ids: string[]) => ids.map(cardId => ({ cardId, type: "PIECIE" }));
function mk(cardId: string, mp = 30, extra: any = {}) {
  return { cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra };
}
function field(slot: any, p1: any = {}, p2Slot: any = null) {
  return makeEngineState({
    turnNumber: 3,
    players: { player_1: { activeSlots: [slot, null], ...p1 }, player_2: { activeSlots: [p2Slot, null] } },
  });
}
const slot0 = (s: any) => s.players.player_1.activeSlots[0];

describe("Gandoe Wizard: Chaos Roll", () => {
  it("1-2 loses 10 MP", () => {
    pushTestDice([1]);
    expect(slot0(runMosjeTriggers(field(mk("mosje_gandoe_wizard")), "startOfTurn", { playerId: "player_1" })).mp).toBe(20);
  });
  it("3-4 nothing", () => {
    pushTestDice([3]);
    expect(slot0(runMosjeTriggers(field(mk("mosje_gandoe_wizard")), "startOfTurn", { playerId: "player_1" })).mp).toBe(30);
  });
  it("5-6 gives +10 Power this turn, gone after the turn ends", () => {
    pushTestDice([6]);
    const s = runMosjeTriggers(field(mk("mosje_gandoe_wizard")), "startOfTurn", { playerId: "player_1" });
    const base = getPower(mk("mosje_gandoe_wizard"));
    expect(getPower(slot0(s))).toBe(base + 10);
    expireThisTurnEffects(s);
    expect(getPower(slot0(s))).toBe(base);
  });
});

describe("AZN Cless: Risk & Reward", () => {
  const end = (s: any) => runMosjeTriggers(s, "endOfTurn", { playerId: "player_1" });
  it("1 with several cards asks the owner which to discard", () => {
    pushTestDice([1]);
    const s = end(field(mk("mosje_azn_cless"), { hand: hand("a", "b") }));
    expect(s.pendingChoice.playerId).toBe("player_1");
    const r = resolvePendingChoice(s, s.pendingChoice.options[1]);
    expect(r.state.players.player_1.hand.map((c: any) => c.cardId)).toEqual(["a"]);
    expect(r.state.players.player_1.graveyard).toHaveLength(1);
    expect(r.state.pendingChoice).toBeUndefined();
  });
  it("1 with a single card discards it automatically", () => {
    pushTestDice([1]);
    const s = end(field(mk("mosje_azn_cless"), { hand: hand("a") }));
    expect(s.pendingChoice).toBeUndefined();
    expect(s.players.player_1.hand).toHaveLength(0);
    expect(s.players.player_1.graveyard).toHaveLength(1);
  });
  it("6 draws 2 and gains 10 MP", () => {
    pushTestDice([6]);
    const s = end(field(mk("mosje_azn_cless"), { hand: hand("a"), deck: hand("d1", "d2", "d3") }));
    expect(s.players.player_1.hand).toHaveLength(3);
    expect(slot0(s).mp).toBe(40);
  });
  it("6 with an empty deck draws nothing (no reshuffle) but still gains 10", () => {
    pushTestDice([6]);
    const s = end(field(mk("mosje_azn_cless"), { hand: hand("a"), deck: [], graveyard: hand("g") }));
    expect(s.players.player_1.hand).toHaveLength(1);
    expect(slot0(s).mp).toBe(40);
  });
  it("2-5 nothing", () => {
    pushTestDice([4]);
    const s = end(field(mk("mosje_azn_cless"), { hand: hand("a") }));
    expect(s.players.player_1.hand).toHaveLength(1);
    expect(slot0(s).mp).toBe(30);
  });
});

describe("Alyssa Fissa: Party Power", () => {
  const destroy = (s: any, by: string) => runMosjeTriggers(s, "placeDestroyed", { destroyingPlayerId: by });
  it("+20 once per turn when her owner destroys a Place", () => {
    let s = destroy(field(mk("mosje_alyssa_fissa")), "player_1");
    expect(slot0(s).mp).toBe(50);
    s = destroy(s, "player_1");
    expect(slot0(s).mp).toBe(50);
  });
  it("nothing when the opponent destroys the Place", () => {
    expect(slot0(destroy(field(mk("mosje_alyssa_fissa")), "player_2")).mp).toBe(30);
  });
});

describe("Michelle: Tough Gamble (one gain)", () => {
  const win = (die: number, mp: number, quest = "arm_wrestling") => {
    const { s, q } = build(quest, { me: mkSlot({ mp }, byName(/Michelle/)) });
    pushTestDice([die]);
    return finish(s, q, true).players.player_1.activeSlots[0];
  };
  it("die 5 doubles: 40 MP + Arm Wrestling 40 -> one gain of 80 -> Level 2 at 0 MP", () => {
    const m = win(5, 40);
    expect(m.level).toBe(2);
    expect(m.mp).toBe(0);
  });
  it("die 2 halves the win (5-grid): +20", () => {
    expect(win(2, 40).mp).toBe(60);
  });
  it("failing a Quest rolls no die", () => {
    const { s, q } = build("arm_wrestling", { me: mkSlot({ mp: 40 }, byName(/Michelle/)) });
    pushTestDice([5]);
    const m = finish(s, q, false).players.player_1.activeSlots[0];
    expect(m.mp).toBe(10);
    // the queued die is untouched: the next roll still sees it
    clearTestDice();
  });
  it("another Mosje winning does not trigger Michelle", () => {
    const { s, q } = build("arm_wrestling", { me: mkSlot({ mp: 30 }, byName(/Ronald/)), p1: {} });
    s.players.player_1.activeSlots[1] = mkSlot({ mp: 40 }, byName(/Michelle/));
    pushTestDice([5]);
    expect(finish(s, q, true).players.player_1.activeSlots[0].mp).toBe(70);
  });
});

describe("Parkour West / Bulldozer / Strongman", () => {
  it("Parkour West gains an extra 20 MP on a Quest win", () => {
    const { s, q } = build("arm_wrestling", { me: mkSlot({ mp: 10 }, byName(/Parkour/)) });
    expect(finish(s, q, true).players.player_1.activeSlots[0].mp).toBe(70);
  });
  for (const id of ["mosje_alyssa_bulldozer", "mosje_jeffrey", "mosje_parkour_west"]) {
    it(`${id} has no manual ability`, () => {
      const r = useMosjeAbility(field(mk(id)), "player_1", id);
      expect(r.success).toBe(false);
    });
  }
});
