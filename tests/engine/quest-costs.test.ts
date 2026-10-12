// @ts-nocheck
// E20 - Quest conditions and "First you must" costs (Obby 2.0).
import { describe, it, expect } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { PIECIES } from "../../src/data/piecies.js";
import { QUESTS } from "../../src/data/quests.js";
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
import { checkQuestCondition } from "../../src/engine/quests/checkQuestCondition.js";
import { payQuestCost } from "../../src/engine/quests/payQuestCost.js";
import { QUEST_CONDITIONS } from "../../src/engine/quests/questConditions.js";
import { QUEST_COSTS } from "../../src/engine/quests/questCosts.js";

const q = (name) => getQuestDef("quest_" + name);
const ready = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });
const fresh = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 5, canActivateOnTurn: 6 });
const food = PIECIES.find(p => p.tag === "food").id;
const sub = PIECIES.find(p => p.tag === "substance").id;
const hand = (cardId, type) => ({ cardId, type });

function build(over = {}, slotOver = {}) {
  const slot = Object.assign(createMosjeSlot(MOSJES[0], { level: 1, mp: 50 }), slotOver);
  const s = makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { activeSlots: [slot, null] },
      player_2: { activeSlots: [createMosjeSlot(MOSJES[1], { mp: 50 }), null] },
    },
  });
  Object.assign(s.players.player_1, over);
  return s;
}

describe("E20 - costs", () => {
  it("every costId in quests.js has a condition or a cost entry", () => {
    const ids = new Set(QUESTS.map(x => x.costId).filter(Boolean));
    expect(ids.size).toBe(21);
    for (const id of ids) expect(!!(QUEST_CONDITIONS[id] || QUEST_COSTS[id])).toBe(true);
  });

  it("Parkour Challenge discards a ready Piecie into the graveyard", () => {
    const s = build({ piecieSlots: [ready(food), null, null] });
    const r = payQuestCost(s, "player_1", 0, q("parkour_challenge"), { zone: "ready", index: 0 });
    expect(r.ok).toBe(true);
    expect(r.state.players.player_1.piecieSlots[0]).toBeNull();
    expect(r.state.players.player_1.graveyard.map(g => g.cardId)).toEqual([food]);
    expect(s.players.player_1.piecieSlots[0]).not.toBeNull();
  });

  it("refuses a not-yet-ready Piecie, state unchanged", () => {
    const s = build({ piecieSlots: [fresh(food), null, null] });
    const r = payQuestCost(s, "player_1", 0, q("parkour_challenge"), { zone: "ready", index: 0 });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });

  it("Endurance Test takes food from hand or ready, refuses non-food", () => {
    const s = build({ hand: [hand(food, "PIECIE"), hand(sub, "PIECIE")], piecieSlots: [ready(food), ready(sub), null] });
    expect(payQuestCost(s, "player_1", 0, q("endurance_test"), { zone: "hand", index: 0 }).ok).toBe(true);
    expect(payQuestCost(s, "player_1", 0, q("endurance_test"), { zone: "ready", index: 0 }).ok).toBe(true);
    expect(payQuestCost(s, "player_1", 0, q("endurance_test"), { zone: "hand", index: 1 }).ok).toBe(false);
    expect(payQuestCost(s, "player_1", 0, q("endurance_test"), { zone: "ready", index: 1 }).ok).toBe(false);
  });

  it("Dutch courage / Larry Temmen need a substance Piecie (hand or ready)", () => {
    const s = build({ hand: [hand(sub, "PIECIE"), hand(food, "PIECIE")], piecieSlots: [ready(sub), null, null] });
    for (const n of ["dutch_courage", "larry_temmen"]) {
      expect(payQuestCost(s, "player_1", 0, q(n), { zone: "hand", index: 0 }).ok).toBe(true);
      expect(payQuestCost(s, "player_1", 0, q(n), { zone: "ready", index: 0 }).ok).toBe(true);
      expect(payQuestCost(s, "player_1", 0, q(n), { zone: "hand", index: 1 }).ok).toBe(false);
    }
  });

  it("Negotiation needs a Piecie from hand; Cheat code a Snelle from hand", () => {
    const s = build({ hand: [hand(food, "PIECIE"), hand("snelle_x", "SNELLE_PIECIE")], piecieSlots: [ready(food), null, null] });
    expect(payQuestCost(s, "player_1", 0, q("negotiation"), { zone: "hand", index: 0 }).ok).toBe(true);
    expect(payQuestCost(s, "player_1", 0, q("negotiation"), { zone: "ready", index: 0 }).ok).toBe(false);
    expect(payQuestCost(s, "player_1", 0, q("cheat_code"), { zone: "hand", index: 1 }).ok).toBe(true);
    expect(payQuestCost(s, "player_1", 0, q("cheat_code"), { zone: "hand", index: 0 }).ok).toBe(false);
  });

  it("Calculate Odds reveals the top 3 and changes nothing", () => {
    const s = build({ deck: ["a", "b", "c", "d"] });
    const r = payQuestCost(s, "player_1", 0, q("calculate_odds"), undefined);
    expect(r.ok).toBe(true);
    expect(r.revealed).toEqual(["a", "b", "c"]);
    expect(r.state.players.player_1.deck).toEqual(["a", "b", "c", "d"]);
  });
});

describe("E20 - conditions", () => {
  const ok = (s, n) => checkQuestCondition(s, "player_1", 0, q(n)).ok;
  it("Build Gadget >= 1 and Speed Run >= 2 activations this turn", () => {
    expect(ok(build({ piecieActivationsThisTurn: 0 }), "build_gadget")).toBe(false);
    expect(ok(build({ piecieActivationsThisTurn: 1 }), "build_gadget")).toBe(true);
    expect(ok(build({ piecieActivationsThisTurn: 1 }), "speed_run")).toBe(false);
    expect(ok(build({ piecieActivationsThisTurn: 2 }), "speed_run")).toBe(true);
  });
  it("level / MP / place / ability conditions", () => {
    expect(ok(build({}, { level: 1 }), "never_give_up")).toBe(true);
    expect(ok(build({}, { level: 2 }), "never_give_up")).toBe(false);
    expect(ok(build({}, { mp: 80 }), "momentum_master")).toBe(true);
    expect(ok(build({}, { mp: 75 }), "momentum_master")).toBe(false);
    expect(ok(build({}, { mp: 70 }), "perfect_timing")).toBe(true);
    expect(ok(build({}, { mp: 85 }), "perfect_timing")).toBe(false);
    const withPlace = build();
    withPlace.activePlace = "place_the_gym";
    expect(ok(withPlace, "ultimate_challenge")).toBe(true);
    expect(ok(build(), "ultimate_challenge")).toBe(false);
    expect(ok(build({}, { abilityUsedThisTurn: true }), "synergy_mastery")).toBe(true);
    expect(ok(build(), "synergy_mastery")).toBe(false);
  });
  it("Piecie board conditions", () => {
    const three = [ready(food), ready(food), ready(food)];
    expect(ok(build({ piecieSlots: three }), "master_plan")).toBe(true);
    expect(ok(build({ piecieSlots: [ready(food), null, null] }), "master_plan")).toBe(false);
    expect(ok(build({ piecieSlots: three }), "create_masterpiece")).toBe(true);
    expect(ok(build({ piecieSlots: [ready(food), null, null] }), "create_masterpiece")).toBe(false);
    const s = build({ piecieSlots: [ready(food), null, null] });
    expect(ok(s, "regelaar")).toBe(true);
    s.players.player_2.piecieSlots = [ready(food), null, null];
    expect(ok(s, "regelaar")).toBe(false);
    expect(ok(build({ piecieSlots: [{ ...ready(food), stays: true }, null, null] }), "endure_pain")).toBe(true);
    expect(ok(build({ piecieSlots: [ready(food), null, null] }), "endure_pain")).toBe(false);
  });
  it("Shotje Obby needs own total MP below the opponent's", () => {
    const s = build();
    s.players.player_2.activeSlots[0].mp = 90;
    expect(ok(s, "shotje_obby")).toBe(true);
    s.players.player_2.activeSlots[0].mp = 50;
    expect(ok(s, "shotje_obby")).toBe(false);
  });
  it("Trained needs trait >= 2 in the rolled trait", () => {
    const lo = build({}, { traits: { physical: 1, technical: 1, social: 1 } });
    const hi = build({}, { traits: { physical: 2, technical: 2, social: 2 } });
    for (const n of ["sprint_race", "debug_system", "team_building"]) {
      expect(ok(lo, n)).toBe(false);
      expect(ok(hi, n)).toBe(true);
    }
  });
});
