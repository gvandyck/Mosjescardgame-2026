// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { mkSlot, byName } from "../helpers/quest56.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
import { startTurn, playPlace } from "../../src/engine/turnManager.js";
import { checkVictory } from "../../src/engine/victoryChecker.js";
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
import { findRerollGrant } from "../../src/engine/quests/findRerollGrant.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { PLACES } from "../../src/data/places.js";
import { PIECIES } from "../../src/data/piecies.js";
import { placeGearDraw } from "../../src/abilities/place/placeTurnQuestEffects.js";

const card = (cardId, type = "PIECIE") => ({ cardId, type });
const deck = () => [card("piecie_kannetje_melk"), card("piecie_kannetje_melk"), card("piecie_kannetje_melk")];
const ming = () => MOSJES.find((m) => m.id === "mosje_ming_natural"); // no start-of-turn or Quest triggers
const fighter = (over = {}) => mkSlot({ subtype: "FIGHTING", mp: 40, ...over }, ming());
const digital = (over = {}) => mkSlot({ subtype: "DIGITAL", mp: 40, ...over }, ming());
const game = (place, p1 = {}, p2 = {}, owner = "player_1") => makeEngineState({
  turnNumber: 5, activePlayerId: "player_1", activePlace: place, activePlacePlayedBy: owner,
  players: { player_1: { deck: deck(), ...p1 }, player_2: { deck: deck(), activeSlots: [digital()], ...p2 } },
});
const mp = (s, pid, i) => s.players[pid].activeSlots[i].mp;

describe("Turn-start Places (start of the turn player's turn only)", () => {
  it("The Gym: non-Fighting Mosjes of the turn player lose 10; Fighting, opponents and fresh ones do not", () => {
    const s = game("place_the_gym",
      { activeSlots: [digital(), fighter(), digital({ entryProtected: true })] },
      { activeSlots: [digital()] });
    const n = startTurn(s);
    expect(mp(n, "player_1", 0)).toBe(30);
    expect(mp(n, "player_1", 1)).toBe(40);
    expect(n.players.player_1.activeSlots[2].mp).toBe(40);
    expect(mp(n, "player_2", 0)).toBe(40);
  });
  it("Bank Chilling: Social 2+ gains 10, Social 1 does not", () => {
    const hi = mkSlot({ mp: 30 }, ming()); hi.traits.social = 2;
    const lo = mkSlot({ mp: 30 }, ming()); lo.traits.social = 1;
    const n = startTurn(game("place_bank_chilling", { activeSlots: [hi, lo] }));
    expect(mp(n, "player_1", 0)).toBe(40);
    expect(mp(n, "player_1", 1)).toBe(30);
  });
  it("Eendjes Voeren: the turn player's Michelle gains 10, another Mosje and the opponent's Michelle do not", () => {
    const m = () => mkSlot({ mp: 30, subtype: "FIGHTING" }, byName(/Michelle/));
    const n = startTurn(game("place_eendjes_voeren", { activeSlots: [m(), digital()] }, { activeSlots: [m()] }));
    expect(mp(n, "player_1", 0)).toBe(40);
    expect(mp(n, "player_1", 1)).toBe(40);
    expect(mp(n, "player_2", 0)).toBe(30);
  });
});

describe("Tesla", () => {
  const tesla = PLACES.find((p) => p.id === "place_tesla");
  const coert = () => mkSlot({ mp: 40, cardId: "mosje_coert_tech" });
  it("cannot be played without a Coert on your field", () => {
    const s = game(null, { hand: [card("place_tesla", "PLACE")], energy: 6, activeSlots: [digital()] });
    expect(playPlace(s, "player_1", card("place_tesla", "PLACE"), tesla).success).toBe(false);
  });
  it("can be played with a Coert and is destroyed to its owner's discard when the Coert is gone", () => {
    const s = game(null, { hand: [card("place_tesla", "PLACE")], energy: 6, activeSlots: [coert()] });
    const r = playPlace(s, "player_1", card("place_tesla", "PLACE"), tesla);
    expect(r.success).toBe(true);
    expect(r.state.activePlace).toBe("place_tesla");
    r.state.players.player_1.activeSlots[0] = null;
    const after = checkVictory(r.state);
    expect(after.activePlace).toBeNull();
    expect(after.players.player_1.graveyard.some((c) => c.cardId === "place_tesla")).toBe(true);
  });
});

describe("Quest Places (one gain, bonus after Michelle's double)", () => {
  afterEach(() => vi.restoreAllMocks());
  const ready = { type: "PIECIE", cardId: "piecie_kannetje_melk", faceDown: true, activated: false, canActivateOnTurn: 1 };
  const q = (place, slot, questId, win) => forceQuestResult(game(place, { activeSlots: [slot], piecieSlots: [{ ...ready }, null, null] }), "player_1", { questId, win, costChoice: { zone: "ready", index: 0 } });
  it("Quest Haven: +25 win becomes 35; a loss is unchanged", () => {
    expect(mp(q("place_quest_haven", mkSlot({ mp: 20 }), "quest_quick_thinking", true), "player_1", 0)).toBe(55);
    expect(mp(q("place_quest_haven", mkSlot({ mp: 50 }), "quest_quick_thinking", false), "player_1", 0)).toBe(35);
  });
  it("Obby #1: win +10 more, loss 10 more", () => {
    expect(mp(q("place_obby_1", mkSlot({ mp: 20 }), "quest_quick_thinking", true), "player_1", 0)).toBe(55);
    expect(mp(q("place_obby_1", mkSlot({ mp: 50 }), "quest_quick_thinking", false), "player_1", 0)).toBe(25);
  });
  it("Michelle + Quest Haven: (Quest MP x 2) + 10 in one gain", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.55); // Tough Gamble die 4 = double
    const m = mkSlot({ mp: 20 }, byName(/Michelle/));
    expect(mp(q("place_quest_haven", m, "quest_quick_thinking", true), "player_1", 0)).toBe(20 + 50 + 10);
  });
  it("a fresh Mosje gets no Place bonus", () => {
    expect(mp(q("place_quest_haven", mkSlot({ mp: 20, entryProtected: true }), "quest_quick_thinking", true), "player_1", 0)).toBe(45);
  });
  it("Delluft: Parkeren Delft win +20 more, another Quest nothing", () => {
    const base = (id) => mp(q(null, mkSlot({ mp: 20 }), id, true), "player_1", 0);
    expect(mp(q("place_delluft", mkSlot({ mp: 20 }), "quest_parkeren_delft", true), "player_1", 0)).toBe(base("quest_parkeren_delft") + 20);
    expect(mp(q("place_delluft", mkSlot({ mp: 20 }), "quest_quick_thinking", true), "player_1", 0)).toBe(base("quest_quick_thinking"));
  });
});

describe("Skiffa reroll and Digital Gaming Stop", () => {
  const offer = (slot) => {
    const s = game("place_skiffa", { activeSlots: [slot] });
    s.questStacks = { FIGHTING: { deck: ["quest_filler"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] },
      DIGITAL: { deck: ["quest_filler"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] },
      ARTISTIC: { deck: ["quest_filler"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] } };
    const stackId = Object.keys(s.questStacks)[0];
    const r = rollQuestAttempt(s, "player_1", { slotIndex: 0, stackId, skipReactions: true, rng: () => 0.5 });
    return r.ok ? findRerollGrant(r.state, "player_1", true) : -2;
  };
  it("an Artistic roller has one reroll option on that roll; Digital and fresh Artistic have none", () => {
    expect(offer(mkSlot({ subtype: "ARTISTIC" }))).toBeGreaterThanOrEqual(0);
    expect(offer(mkSlot({ subtype: "DIGITAL" }))).toBe(-1);
    expect(offer(mkSlot({ subtype: "ARTISTIC", entryProtected: true }))).toBe(-1);
  });
  const gear = PIECIES.find((p) => p.tag === "gear");
  const food = PIECIES.find((p) => p.tag === "food");
  it("DGS: a gear Piecie activation draws 1 for the activator, a non-gear Piecie draws 0", () => {
    const s = game("place_digital_gaming_stop");
    expect(placeGearDraw(s, "player_2", gear).players.player_2.hand.length).toBe(1);
    expect(placeGearDraw(s, "player_1", food).players.player_1.hand.length).toBe(0);
  });
  it("DGS: an empty deck draws nothing", () => {
    const s = game("place_digital_gaming_stop", { deck: [] });
    expect(placeGearDraw(s, "player_1", gear).players.player_1.hand.length).toBe(0);
  });
});
