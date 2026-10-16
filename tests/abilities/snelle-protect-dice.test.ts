// Phase 60-02 (EFX-03): Emergency Healings, The Protector, Perfect Dodge, Drain Reversal, Not Today!, Lucky Coin, Sleutelpuntje, Je Weet Niet (Card List numbers).
import { describe, expect, it } from "vitest";
// @ts-expect-error — JS modules
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error
import { attackMosje } from "../../src/engine/actions/attackMosje.js";
// @ts-expect-error
import { resolveReaction } from "../../src/engine/reactions/resolveReaction.js";
// @ts-expect-error
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";
// @ts-expect-error
import * as fx from "../../src/abilities/snelleEffects.js";
// @ts-expect-error
import { MOSJES } from "../../src/data/mosjes.js";

const ming = MOSJES.find((m: any) => m.id === "mosje_ming_predictor");
const alyssa = MOSJES.find((m: any) => m.id === "mosje_alyssa_bulldozer");
const mk = (mp: number, extra: any = {}, def = ming) => {
  const s = createMosjeSlot(def, { level: 1, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
const mine = (state: any, i = 0) => state.players.player_2.activeSlots[i];
const reaction = (mpLoss: any, extra: any = {}) => ({ moments: ["wouldLoseMp"], preview: { getemt: [], toWelloe: false, mpLoss }, actorId: "player_1", ...extra });
// player_2 is the defender (own), player_1 the opponent.
const board = (own: any[], opp: any[]) => makeEngineState({ turnNumber: 3, players: { player_1: { activeSlots: opp }, player_2: { activeSlots: own } } });
const hit = (s: any, amount: number, slot = 0) => loseMP(s, "player_2", slot, amount, "ATTACK", false, "player_1");

describe("loss reductions and Emergency Healings", () => {
  it("Emergency Healings: gain first, then the loss (Resilient 2: 35)", () => {
    const s = fx.effect_snelle_emergency_healings(board([mk(30)], [mk(40)]), "player_2", { reaction: reaction({ 0: 40 }) });
    expect(mine(hit(s, 40)).mp).toBe(15);
    const r = board([mk(30, { traits: { resilient: 2 } })], [mk(40)]);
    expect(mine(hit(fx.effect_snelle_emergency_healings(r, "player_2", { reaction: reaction({ 0: 40 }) }), 40)).mp).toBe(25);
  });
  it("The Protector: 30 less; two threatened Mosjes -> a pick", () => {
    const one = fx.effect_snelle_the_protector(board([mk(60), mk(60)], [mk(40)]), "player_2", { reaction: reaction({ 0: 40 }) });
    expect(mine(hit(one, 40)).mp).toBe(50);
    const two = fx.effect_snelle_the_protector(board([mk(60), mk(60)], [mk(40)]), "player_2", { reaction: reaction({ 0: 40, 1: 40 }) });
    expect(two.needChoice.options).toHaveLength(2);
  });
  it("Perfect Dodge: Physical 2 -> 20 less, Physical 3 -> 30 less (no loss)", () => {
    const act = { type: "attack", args: [{}, { targetPlayerId: "player_2", targetSlotIndex: 0 }] };
    const dodge = (ph: number) => hit(fx.effect_snelle_perfect_dodge(board([mk(60, { traits: { physical: ph } })], [mk(40)]), "player_2", { reaction: reaction({ 0: 30 }, { action: act }) }), 30);
    expect(mine(dodge(2)).mp).toBe(50);
    expect(mine(dodge(3)).mp).toBe(60);
  });
  it("Drain Reversal: 20 less and a fixed 10 on an opponent Mosje (not the reflected amount)", () => {
    const s = fx.effect_snelle_drain_reversal(board([mk(60)], [mk(40)]), "player_2", { reaction: reaction({ 0: 30 }) });
    expect(s.players.player_1.activeSlots[0].mp).toBe(30);
    expect(mine(hit(s, 30)).mp).toBe(50);
  });
  it("a reduction is one-shot: a second loss is full", () => {
    const s = hit(fx.effect_snelle_the_protector(board([mk(90)], [mk(40)]), "player_2", { reaction: reaction({ 0: 40 }) }), 40);
    expect(mine(hit(s, 40)).mp).toBe(40); // 90 - 10 (reduced) - 40 (full)
  });
  it("the Stabilizer cap comes after the reduction (section 2g)", () => {
    const s = board([mk(90)], [mk(40)]);
    s.activePlace = "place_momentum_stabilizer";
    const r = fx.effect_snelle_the_protector(s, "player_2", { reaction: reaction({ 0: 60 }) });
    expect(mine(hit(r, 60)).mp).toBe(60); // 60 - 30 = 30, cap 30
  });
});

describe("Not Today!", () => {
  const sideways = () => board([mk(5, { sideways: true }), mk(50)], [mk(40)]);
  const window = { moments: ["toWelloe"], preview: { getemt: [0], toWelloe: true, mpLoss: { 0: 5 } } };
  it("a sideways Mosje at 5 MP hit for 10 stays, sideways, welloePile unchanged", () => {
    const s = fx.effect_snelle_negate_elimination(sideways(), "player_2", { reaction: window });
    const out = checkVictory(hit(s, 10));
    expect(mine(out)).not.toBeNull();
    expect(mine(out).sideways).toBe(true);
    expect(mine(out).mp).toBe(5);
    expect(out.players.player_2.welloePile).toHaveLength(0);
  });
  it("at 0 MP it goes to 5", () => {
    const s = fx.effect_snelle_negate_elimination(board([mk(0, { sideways: true }), mk(50)], [mk(40)]), "player_2", { reaction: window });
    expect(mine(checkVictory(hit(s, 10))).mp).toBe(5);
  });
  it("without the Snelle the same hit sends it to the Welloe pile", () => {
    const out = checkVictory(hit(sideways(), 10));
    expect(out.players.player_2.welloePile).toHaveLength(1);
  });
});

describe("window integration", () => {
  it("Perfect Dodge answered in the attacked window shrinks the attack and leaves no entries", () => {
    const s = makeEngineState({ turnNumber: 3, players: {
      player_1: { activeSlots: [mk(50, {}, alyssa), mk(50)] },
      player_2: { activeSlots: [mk(50, { traits: { physical: 2 } }), mk(50)], hand: [{ cardId: "snelle_perfect_dodge" }], energy: 3 } } });
    const r = attackMosje(s, "player_1", { attackerSlotIndex: 0, targetPlayerId: "player_2", targetSlotIndex: 0 });
    expect(r.state.pendingReaction.eligible).toContain("snelle_perfect_dodge");
    const out = resolveReaction(r.state, "player_2", "snelle_perfect_dodge");
    expect(mine(out.state).mp).toBe(50); // the attack's 20 is fully absorbed (20 less)
    expect(out.state.reactionMods).toBeUndefined();
  });
});

describe("dice Snelle", () => {
  const roll = (dice: number[]) => ({ playerId: "player_1", slotIndex: 0, stackId: "a", questId: "quest_quick_thinking", dice, diceCount: dice.length, win: false });
  const lucky = (s: any) => fx.effect_snelle_lucky_coin(s, "player_2", { reaction: { moments: ["afterQuestRoll"] } });
  it("Sleutelpuntje adds one die to the next Quest roll, never above 4", () => {
    const s = fx.effect_snelle_sleutelpuntje(board([mk(50)], [mk(40)]), "player_2");
    expect(s.players.player_2.questExtraDice).toBe(1);
    expect(getQuestDiceCount(s, "player_2", mine(s), { rollTrait: "x" }, { extra: 9 })).toBe(4);
  });
  it("Je Weet Niet rerolls every die of the held roll", () => {
    const s = board([mk(50)], [mk(40)]);
    s.pendingQuestRoll = roll([1, 1, 1]);
    const out = fx.effect_snelle_jeweetniet(s, "player_2");
    expect(out.pendingQuestRoll.dice).toHaveLength(3);
  });
  it("Lucky Coin: dice are picked one by one; Creative 3 chooses the value", () => {
    const a = board([mk(50, { traits: { creative: 3 } })], [mk(40)]);
    a.pendingQuestRoll = roll([1, 2]);
    expect(lucky(a).needChoice.options.some((o: any) => o.die === 0)).toBe(true);
    const b = board([mk(50, { traits: { creative: 1 } })], [mk(40)]);
    b.pendingQuestRoll = roll([1, 2]);
    b.players.player_2._pendingTargets = { coin_0: { label: "Die 1", die: 0 } };
    expect(lucky(b).needChoice.key).toBe("coin_1");
    b.players.player_2._pendingTargets.coin_1 = { label: "Done", done: true };
    expect(lucky(b).pendingQuestRoll.dice).toHaveLength(2);
    const d = board([mk(50, { traits: { creative: 3 } })], [mk(40)]);
    d.pendingQuestRoll = roll([1, 2]);
    d.players.player_2._pendingTargets = { coin_0: { die: 1 }, coin_v_0: { value: 6 }, coin_1: { done: true } };
    expect(lucky(d).pendingQuestRoll.dice).toEqual([1, 6]);
  });
  it("Lucky Coin without Creative 3 ignores a smuggled value (rerolls instead)", () => {
    const d = board([mk(50, { traits: { creative: 1 } })], [mk(40)]);
    d.pendingQuestRoll = roll([1, 2]);
    d.players.player_2._pendingTargets = { coin_0: { die: 1 }, coin_v_0: { value: 99 }, coin_1: { done: true } };
    const dice = lucky(d).pendingQuestRoll.dice;
    expect(dice[0]).toBe(1);
    expect(dice[1]).toBeLessThanOrEqual(6);
  });
});
