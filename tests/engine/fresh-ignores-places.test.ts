// @ts-nocheck
// RULE-08: a fresh Mosje ignores Places (good and bad side); a non-fresh one does not.
// Each of the 20 Places is probed on the real 2.0 code paths: Power, Quest dice, Quest MP bonus,
// start-of-turn MP, MP loss (cap / reducer) and MP gain (The Void). Fresh must match the no-Place
// baseline; every Place that touches Mosjes must change the non-fresh probe (so nothing is vacuous).
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { mkSlot, byName } from "../helpers/quest56.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { PLACES } from "../../src/data/places.js";
import { getPower } from "../../src/engine/mp/getPower.js";
import { QUEST_DICE_SOURCES } from "../../src/engine/quests/questDiceSources.js";
import { placeQuestBonus } from "../../src/abilities/place/placeTurnQuestEffects.js";
import { startTurn } from "../../src/engine/turnManager.js";
import { loseMP, gainMP } from "../../src/engine/mpManager.js";
import { isHolderTextActive } from "../../src/engine/synergy/isHolderTextActive.js";
import { effect_momentum_factory } from "../../src/abilities/placeEffects.js";

// The 20 Card List Places. Momentum Factory is a V4 leftover still in data (no Card List entry): tested apart below.
const ALL = PLACES.map((p) => p.id).filter((id) => id !== "place_momentum_factory");
const CAST = ["Gandoe", "Michelle", "Tuk", "Coert", "Ming"]; // Fighting/Gandoe, Michelle, Artistic Tuk, Digital Coert, Digital Ming
const mosjeFor = (word) => byName(new RegExp(word));
const slotFor = (word, fresh) => {
  const s = mkSlot({ mp: 80, entryProtected: fresh }, mosjeFor(word));
  s.traits = { physical: 3, mental: 3, creative: 3, technical: 3, resilient: 3, social: 3 };
  return s;
};
const world = (place, slot) => makeEngineState({
  turnNumber: 5, activePlayerId: "player_1", activePlace: place, activePlacePlayedBy: "player_1",
  players: { player_1: { activeSlots: [slot, null], deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
});
const dice = (st, slot, trait) => QUEST_DICE_SOURCES.reduce((n, f) => n + f({ state: st, playerId: "player_1", slot, quest: { rollTrait: trait } }), 0);

// One observation of how `place` treats one Mosje, across every channel a Place can touch.
function probe(place, word, fresh) {
  const slot = slotFor(word, fresh);
  const st = world(place, slot);
  const afterLoss = loseMP(st, "player_1", 0, 50, "ATTACK", false, "player_1").players.player_1.activeSlots[0].mp; // own-sourced: fresh does not fizzle it
  const afterGain = gainMP(st, "player_1", 0, 10, "PIECIE").players.player_1.activeSlots[0].mp;
  // Start-of-turn MP is measured as the Place's own change: some Mosjes have start triggers of their own.
  const turnMp = (pl) => startTurn(world(pl, slotFor(word, fresh))).players.player_1.activeSlots[0].mp;
  const turn = turnMp(place) - turnMp(null);
  return {
    power: getPower(slot, st, "player_1"),
    dicePhys: dice(st, slot, "physical"), diceTech: dice(st, slot, "technical"),
    bonusWin: placeQuestBonus(st, slot, "quest_quick_thinking", true), bonusLose: placeQuestBonus(st, slot, "quest_quick_thinking", false),
    bonusParking: placeQuestBonus(st, slot, "quest_parkeren_delft", true),
    afterLoss, afterGain, turn,
  };
}
const probeAll = (place, fresh) => CAST.map((w) => probe(place, w, fresh));

// Places whose effect lands on a Mosje through the channels above. Every one must move the non-fresh probe.
const MOSJE_PLACES = [
  "place_the_gym", "place_bank_chilling", "place_quest_haven", "place_skiffa", "place_obby_1", "place_arcade",
  "place_zo_is_natuur", "place_the_void", "place_drain_zone", "place_momentum_stabilizer", "place_delluft",
  "place_dierenasiel", "place_boxing_ring", "place_tesla", "place_eendjes_voeren", "place_de_box",
];
// Handled by dedicated cases below: Synergy Chamber acts on Mosjes; the other three only
// change what a card costs / draws for a player, so no Mosje channel moves.
const SPECIAL = ["place_synergy_chamber"];
const PLAYER_LEVEL = ["place_coerts_caravan", "place_welloe_graveyard", "place_digital_gaming_stop"];

describe("fresh Mosjes ignore Places (RULE-08)", () => {
  beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0.5); }); // start-of-turn triggers of some Mosjes roll dice
  afterEach(() => vi.restoreAllMocks());

  it("the three groups cover exactly the 20 Places", () => {
    expect(ALL).toHaveLength(20);
    expect([...MOSJE_PLACES, ...SPECIAL, ...PLAYER_LEVEL].sort()).toEqual([...ALL].sort());
  });

  it("the baseline probe is sensible: a non-fresh and fresh Mosje are identical with no Place", () => {
    expect(probeAll(null, true)).toEqual(probeAll(null, false));
    expect(probe(null, "Gandoe", false).power).toBeGreaterThan(0);
    expect(probe(null, "Gandoe", false).afterLoss).toBe(30); // 80 - 50 own-sourced loss
  });

  for (const place of MOSJE_PLACES) {
    it(`${place}: fresh = no Place at all, non-fresh is affected`, () => {
      const baseline = probeAll(null, false);
      expect(probeAll(place, true)).toEqual(baseline); // fresh: good and bad side ignored
      expect(probeAll(place, false)).not.toEqual(baseline); // non-fresh: really affected (not vacuous)
    });
  }

  it("covers every channel: Power, dice, Quest MP, start-of-turn MP, loss and gain each moved by some Place", () => {
    const base = probeAll(null, false);
    const moved = new Set();
    for (const place of MOSJE_PLACES) {
      probeAll(place, false).forEach((p, i) => Object.keys(p).forEach((k) => { if (p[k] !== base[i][k]) moved.add(k); }));
    }
    for (const k of ["power", "dicePhys", "diceTech", "bonusWin", "bonusLose", "bonusParking", "afterLoss", "afterGain", "turn"]) expect(moved.has(k), k).toBe(true);
  });

  it("both sides: a bad-side Place (Bank Chilling -10 Power) and a good-side one (Drain Zone +10) are both ignored when fresh", () => {
    const base = probe(null, "Gandoe", false).power;
    expect(probe("place_bank_chilling", "Gandoe", false).power).toBe(base - 10);
    expect(probe("place_drain_zone", "Gandoe", false).power).toBe(base + 10);
    expect(probe("place_bank_chilling", "Gandoe", true).power).toBe(base);
    expect(probe("place_drain_zone", "Gandoe", true).power).toBe(base);
  });

  it("Momentum Stabilizer: an own 50 loss is capped to 30 for a non-fresh Mosje and applies in full when fresh", () => {
    expect(probe("place_momentum_stabilizer", "Gandoe", false).afterLoss).toBe(probe(null, "Gandoe", false).afterLoss + 20);
    expect(probe("place_momentum_stabilizer", "Gandoe", true).afterLoss).toBe(probe(null, "Gandoe", true).afterLoss);
  });

  it("Synergy Chamber: the holder text goes live without its partner for a non-fresh holder only", () => {
    const holderId = "mosje_martin_historian"; // partner: Cless, The Teacher (not on the field)
    const mk = (fresh) => { const s = mkSlot({ mp: 40, entryProtected: fresh }, MOSJES.find((m) => m.id === holderId)); return s; };
    const g = (place, fresh) => world(place, mk(fresh));
    expect(isHolderTextActive(g(null, false), "player_1", holderId)).toBe(false);
    expect(isHolderTextActive(g("place_synergy_chamber", false), "player_1", holderId)).toBe(true);
    expect(isHolderTextActive(g("place_synergy_chamber", true), "player_1", holderId)).toBe(false);
  });

  it("Momentum Factory: the first-Piecie +10 goes to a non-fresh Mosje and never to a fresh one", () => {
    const run = (fresh) => {
      const st = world("place_momentum_factory", slotFor("Gandoe", fresh));
      st.players.player_1.pieciesPlayedThisTurn = 1;
      return effect_momentum_factory(st).players.player_1.activeSlots[0].mp;
    };
    expect(run(false)).toBe(90);
    expect(run(true)).toBe(80);
  });

  for (const place of PLAYER_LEVEL) {
    it(`${place}: changes costs / draws for a player, so no Mosje channel moves (fresh or not)`, () => {
      const baseline = probeAll(null, false);
      expect(probeAll(place, false)).toEqual(baseline);
      expect(probeAll(place, true)).toEqual(baseline);
    });
  }
});
