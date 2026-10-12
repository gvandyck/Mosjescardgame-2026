// @ts-nocheck
// 56-04 - named bonuses, Vraag Aad, Cheat code, Debug System, Parkeren Delft, Form Alliance.
import { describe, it, expect } from "vitest";
import { build, finish, mkSlot, byName } from "../helpers/quest56.js";
import { QUESTS } from "../../src/data/quests.js";
import { QUEST_EXTRAS } from "../../src/engine/quests/questExtras.js";
import { drawFromEffect } from "../../src/engine/turn/drawFromEffect.js";

const mp = (s) => s.players.player_1.activeSlots[0].mp;
const card = (id) => ({ cardId: id, type: "SNELLE" });
const gy = (n) => Array.from({ length: n }, (_, i) => ({ cardId: "c" + i, name: "c" + i }));

describe("Quest extras", () => {
  it("Geen Raad win: Gandoe +60, others +50", () => {
    let { s, q } = build("geen_raad_vraag_aad", { me: mkSlot({}, byName(/^Gandoe/)) });
    expect(mp(finish(s, q, true))).toBe(90);
    ({ s, q } = build("geen_raad_vraag_aad", { me: mkSlot({}, byName(/^Youri/)) }));
    expect(mp(finish(s, q, true))).toBe(80);
  });
  it("Vraag Aad: discard 1 hand card -> lose 10, else 25", () => {
    const { s, q } = build("geen_raad_vraag_aad", { me: mkSlot({ mp: 50 }), p1: { hand: [card("snelle_x")] } });
    const out = finish(s, q, false, { vraagAadDiscardHandIndex: 0 });
    expect(mp(out)).toBe(40);
    expect(out.players.player_1.hand).toHaveLength(0);
    expect(out.players.player_1.graveyard).toHaveLength(1);
    expect(mp(finish(s, q, false))).toBe(25);
  });
  it("Speed Run win by Youri +60", () => {
    const { s, q } = build("speed_run", { me: mkSlot({}, byName(/^Youri/)) });
    expect(mp(finish(s, q, true))).toBe(90);
  });
  it("Parkeren Delft: Coert +60 on win, Cless -40 on fail", () => {
    let { s, q } = build("parkeren_delft", { me: mkSlot({ mp: 30 }, byName(/^Coert, The/)) });
    expect(mp(finish(s, q, true))).toBe(90);
    ({ s, q } = build("parkeren_delft", { me: mkSlot({ mp: 60 }, byName(/^AZN Cless/)) }));
    expect(mp(finish(s, q, false))).toBe(20);
  });
  it("Parkeren Delft removes chosen discards from the game (max 3)", () => {
    const { s, q } = build("parkeren_delft", { p1: { graveyard: gy(3) }, p2: { graveyard: gy(3) } });
    const picks = [0, 1].map(i => ({ playerId: "player_1", graveyardIndex: i }))
      .concat([0, 1].map(i => ({ playerId: "player_2", graveyardIndex: i })));
    const out = finish(s, q, true, { parkerenRemove: picks });
    expect(out.removedFromGame).toHaveLength(3);
    expect(out.players.player_1.graveyard.length + out.players.player_2.graveyard.length).toBe(3);
    expect(finish(s, q, true, { parkerenRemove: picks.slice(0, 2) }).removedFromGame).toHaveLength(2);
  });
  it("Cheat code win draws 1; empty deck draws nothing, no reshuffle, no cooldown", () => {
    let { s, q } = build("cheat_code", { p1: { deck: [card("a"), card("b")], hand: [] } });
    expect(finish(s, q, true).players.player_1.hand).toHaveLength(1);
    ({ s, q } = build("cheat_code", { p1: { deck: [], hand: [], graveyard: [card("g")] } }));
    const out = finish(s, q, true).players.player_1;
    expect(out.hand).toHaveLength(0);
    expect(out.graveyard).toHaveLength(1);
    expect(out.cooldownTurn).toBeFalsy();
  });
  it("drawFromEffect with 1 card in deck draws 1 of 2", () => {
    const { s } = build("cheat_code", { p1: { deck: [card("a")], hand: [] } });
    expect(drawFromEffect(s, "player_1", 2).players.player_1.hand).toHaveLength(1);
  });
  it("Debug System reorders the top 5 of the chosen deck", () => {
    const { s, q } = build("debug_system", { p2: { deck: ["a", "b", "c", "d", "e", "f"].map(card) } });
    const ids = (st) => st.players.player_2.deck.map(c => c.cardId);
    expect(ids(finish(s, q, true, { debugSystem: { deckOwnerId: "player_2", order: [4, 3, 2, 1, 0] } }))).toEqual(["e", "d", "c", "b", "a", "f"]);
    expect(ids(finish(s, q, true))).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
  it("Form Alliance: chosen non-fresh opponent +10, fresh ignored", () => {
    const T = { playerId: "player_2", slotIndex: 0 };
    let { s, q } = build("form_alliance");
    expect(finish(s, q, true, { formAllianceTarget: T }).players.player_2.activeSlots[0].mp).toBe(50);
    ({ s, q } = build("form_alliance", { opp: [mkSlot({ mp: 40, entryProtected: true }), null] }));
    expect(finish(s, q, true, { formAllianceTarget: T }).players.player_2.activeSlots[0].mp).toBe(40);
  });
  it("every 2.0 Quest with a Card List extras text has a QUEST_EXTRAS entry", () => {
    for (const q of QUESTS.filter(q => q.extras && ["FIGHTING", "DIGITAL", "ARTISTIC"].includes(q.stack))) {
      expect(QUEST_EXTRAS[q.id], q.id).toBeTruthy();
    }
  });
});
