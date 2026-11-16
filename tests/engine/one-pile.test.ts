// @ts-nocheck
// Phase 70-03 (rules section 10): one pile per player. A fallen Mosje is a 'MOSJE' entry in player.graveyard.
import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/engine/gameState.js";
import { phaseDrawCard } from "../../src/engine/turnManager.js";
import { markMosjeDefeated } from "../../src/engine/victoryChecker.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { getPileMosjes } from "../../src/engine/pile/getPileMosjes.js";
import { getPileCards } from "../../src/engine/pile/getPileCards.js";
import { addMosjeToPile } from "../../src/engine/pile/addMosjeToPile.js";
import { takeMosjeFromPile } from "../../src/engine/pile/takeMosjeFromPile.js";
import { detectReactionMoments } from "../../src/engine/reactions/detectReactionMoments.js";
import { checkLoss } from "../../src/engine/winLose/checkLoss.js";
import { summonFromWelloe } from "../../src/abilities/piecie/summonFromWelloe.js";
import { removeDiscardsFromGame } from "../../src/engine/quests/removeDiscardsFromGame.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const jeffrey = MOSJES.find((m) => m.id === "mosje_jeffrey");
const mosjeEntry = (id = "mosje_jeffrey") => ({ cardId: id, name: id, type: "MOSJE", source: "welloe" });
const piecie = (id) => ({ cardId: id, name: id, type: "PIECIE", source: "discarded" });

describe("one pile per player", () => {
  it("a new game has no welloePile key on a player", () => {
    const s = createInitialGameState([{ playerId: "player_1", name: "A", deckId: "STARTER_PHYSICAL" }, { playerId: "player_2", name: "B", deckId: "STARTER_DIGITAL" }], "R", { firstPlayerId: "player_1" });
    for (const p of Object.values(s.players)) expect(p).not.toHaveProperty("welloePile");
  });

  it("a getemt Level 1 sideways Mosje lands in graveyard as a MOSJE entry; its slot is null", () => {
    const st = makeEngineState();
    st.players.player_1.activeSlots = [createMosjeSlot(jeffrey, { mp: 5 }), createMosjeSlot(jeffrey)];
    st.players.player_1.activeSlots[0].sideways = true;
    st.players.player_1.activeSlots[0]._pendingWelloe = true;
    const out = markMosjeDefeated(st, "player_1", 0);
    expect(out.players.player_1.activeSlots[0]).toBeNull();
    expect(out.players.player_1.graveyard).toEqual([expect.objectContaining({ cardId: "mosje_jeffrey", type: "MOSJE", source: "welloe", name: jeffrey.name })]);
  });

  it("getPileMosjes / getPileCards split the pile and keep the order", () => {
    const player = { graveyard: [piecie("a"), mosjeEntry("m1"), piecie("b"), mosjeEntry("m2")] };
    expect(getPileMosjes(player).map((e) => e.cardId)).toEqual(["m1", "m2"]);
    expect(getPileCards(player).map((e) => e.cardId)).toEqual(["a", "b"]);
  });

  it("addMosjeToPile / takeMosjeFromPile round trip; take returns null when absent", () => {
    const player = { graveyard: [piecie("a")] };
    addMosjeToPile(player, { cardId: "mosje_jeffrey", name: "Jeffrey" });
    expect(getPileMosjes(player)).toHaveLength(1);
    expect(takeMosjeFromPile(player, "mosje_binti")).toBeNull();
    expect(takeMosjeFromPile(player, "mosje_jeffrey")).toMatchObject({ cardId: "mosje_jeffrey" });
    expect(player.graveyard.map((e) => e.cardId)).toEqual(["a"]);
  });

  it("deck-out: the 4 non-Mosje cards become the deck, the 2 Mosjes stay, cooldown set, count 4", () => {
    const st = makeEngineState();
    const p = st.players.player_1;
    p.deck = [];
    p.graveyard = [piecie("p1"), mosjeEntry("m1"), piecie("p2"), { cardId: "pl", type: "PLACE" }, piecie("p3"), mosjeEntry("m2")];
    const out = phaseDrawCard(st, "player_1");
    const q = out.players.player_1;
    expect(q.hand.length + q.deck.length).toBe(4);
    expect(q.graveyard.map((e) => e.cardId)).toEqual(["m1", "m2"]);
    expect(q.cooldownTurn).toBe(true);
    expect(out._deckOutEvent.reshuffledCount).toBe(4);
  });

  it("deck-out with only Mosjes in the pile: no draw, no cooldown, pile unchanged", () => {
    const st = makeEngineState();
    st.players.player_1.graveyard = [mosjeEntry("m1"), mosjeEntry("m2")];
    const out = phaseDrawCard(st, "player_1");
    expect(out.players.player_1.hand).toHaveLength(0);
    expect(out.players.player_1.cooldownTurn).not.toBe(true);
    expect(out.players.player_1.graveyard).toHaveLength(2);
  });

  it("summonFromWelloe takes the Mosje out of the single pile and keeps the discards; Welloe Graveyard blocks it", () => {
    const st = makeEngineState();
    st.players.player_1.graveyard = [piecie("a"), mosjeEntry()];
    expect(summonFromWelloe(st, "player_1", "mosje_jeffrey")).toBe(0);
    expect(st.players.player_1.graveyard.map((e) => e.cardId)).toEqual(["a"]);
    const blocked = makeEngineState({ activePlace: "place_welloe_graveyard" });
    blocked.players.player_1.graveyard = [mosjeEntry()];
    expect(summonFromWelloe(blocked, "player_1", "mosje_jeffrey")).toBe(-1);
    expect(blocked.players.player_1.graveyard).toHaveLength(1);
  });

  it("detectReactionMoments reports toWelloe for a fallen Mosje, not for a discarded Piecie", () => {
    const before = makeEngineState();
    const fell = makeEngineState();
    fell.players.player_2.graveyard = [mosjeEntry()];
    const disc = makeEngineState();
    disc.players.player_2.graveyard = [piecie("a")];
    const args = { actorId: "player_1", responderId: "player_2", actionType: "playSnelle" };
    expect(detectReactionMoments(before, fell, args).preview.toWelloe).toBe(true);
    expect(detectReactionMoments(before, disc, args).preview.toWelloe).toBe(false);
  });

  it("checkLoss ignores Mosjes in the pile", () => {
    expect(checkLoss({ activeSlots: [null, null], hand: [], deck: [], graveyard: [mosjeEntry()] })).toBe(true);
  });

  it("T-70-03: Parkeren Delft cannot remove a fallen Mosje (source welloe) from the pile", () => {
    const st = makeEngineState();
    st.players.player_2.graveyard = [mosjeEntry(), piecie("a")];
    const out = removeDiscardsFromGame(st, [{ playerId: "player_2", graveyardIndex: 0 }, { playerId: "player_2", graveyardIndex: 1 }]);
    expect(out.players.player_2.graveyard.map((e) => e.cardId)).toEqual(["mosje_jeffrey"]);
    expect(out.removedFromGame.map((e) => e.cardId)).toEqual(["a"]);
  });
});
