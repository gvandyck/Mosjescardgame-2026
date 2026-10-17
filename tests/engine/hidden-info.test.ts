// @ts-nocheck
// EFX-07: hidden information. Reveals are recorded per viewer in state.revealed[viewerId]; the bot only uses what a card reveals.
import { describe, it, expect, vi } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { mkSlot } from "../helpers/quest56.js";
import { revealCards } from "../../src/engine/hidden/revealCards.js";
import { getRevealedFor } from "../../src/engine/hidden/getRevealedFor.js";
import { ronaldChefStrategicInsight } from "../../src/abilities/mosje/ronaldChefStrategicInsight.js";
import { fpsWestGuess } from "../../src/abilities/mosje/fpsWestGuess.js";
import { fpsWestRevealHand } from "../../src/engine/mosje/fpsWestRevealHand.js";
import { effect_stookerino } from "../../src/abilities/piecie/utilityDrawPiecies.js";
import { effect_jantje_jantje } from "../../src/abilities/piecie/attackRevealPiecies.js";
import { effect_chefs_special } from "../../src/abilities/piecie/mpPiecies.js";
import { effect_those_eyelashes } from "../../src/abilities/piecie/utilityHandPiecies.js";
import { defaultAbilityInputs } from "../../src/bot/strategy/defaultAbilityInputs.js";

const card = (cardId, type = "PIECIE") => ({ cardId, type });
const OPP_HAND = () => [card("piecie_kannetje_melk"), card("piecie_broodje_doner"), card("snelle_jensen", "SNELLE")];
const ids = (h) => h.map((c) => c.cardId);
const game = (mosjeId, extra1 = {}, extra2 = {}) => makeEngineState({
  turnNumber: 3,
  players: {
    player_1: { activeSlots: [mkSlot({ mp: 40, cardId: mosjeId }), null], piecieSlots: [card("piecie_x"), null, null], ...extra1 },
    player_2: { activeSlots: [mkSlot({ mp: 40 }), null], hand: OPP_HAND(), ...extra2 },
  },
});
const onlyViewer = (st, viewer) => {
  const other = viewer === "player_1" ? "player_2" : "player_1";
  expect(getRevealedFor(st, viewer).length).toBeGreaterThan(0);
  expect(getRevealedFor(st, other)).toEqual([]);
};

describe("revealCards / getRevealedFor", () => {
  it("records source, card ids and turn for the viewer only", () => {
    const st = revealCards(makeEngineState({ turnNumber: 4 }), "player_1", "x", ["a", "b"]);
    expect(st.revealed.player_1).toEqual([{ source: "x", cardIds: ["a", "b"], turnNumber: 4 }]);
    expect(st.revealed.player_2).toBeUndefined();
  });
  it("reveals of an earlier turn are not returned and are dropped on the next write", () => {
    const st = revealCards(makeEngineState({ turnNumber: 4 }), "player_1", "x", ["a"]);
    st.turnNumber = 5;
    expect(getRevealedFor(st, "player_1")).toEqual([]);
    revealCards(st, "player_1", "y", ["b"]);
    expect(st.revealed.player_1).toHaveLength(1);
    expect(getRevealedFor(st, "player_1")[0].source).toBe("y");
  });
});

describe("the six hidden-info cards reveal to the activator only", () => {
  it("Ronald, The Master Chef - Strategic Insight: the opponent hand, before the chosen card is set aside", () => {
    const st = game("mosje_ronald_chef");
    st._pendingTargets = { locked_card: 1 };
    const out = ronaldChefStrategicInsight(st, "player_1");
    onlyViewer(out, "player_1");
    expect(getRevealedFor(out, "player_1")[0].cardIds).toEqual(ids(OPP_HAND()));
    expect(out.players.player_2.setAside[0].card.cardId).toBe("piecie_broodje_doner");
    expect(out.revealedHandTo).toBeUndefined();
  });
  it("FPS West: the ability and the holder text", () => {
    const st = game("mosje_fps_west");
    st._pendingTargets = { card_type: "PIECIE" };
    const a = fpsWestGuess(st, "player_1");
    onlyViewer(a, "player_1");
    expect(getRevealedFor(a, "player_1")[0].cardIds).toEqual(ids(OPP_HAND()));
    const holder = game("mosje_fps_west");
    holder.players.player_1.activeSlots[1] = mkSlot({ mp: 40, cardId: "mosje_fps_coert" });
    const h = fpsWestRevealHand(holder, "player_1");
    expect(h.success).toBe(true);
    onlyViewer(h.state, "player_1");
  });
  it("Stookerino: the hand is shown before the pick and the options come from it", () => {
    const r = effect_stookerino(game("mosje_ming_natural"), "player_1");
    expect(r.needChoice.playerId).toBe("player_1");
    onlyViewer(r.state, "player_1");
    expect(r.needChoice.options.map((o) => o.cardId)).toEqual(ids(OPP_HAND()));
  });
  it("Jantje Jantje...: shows the hand to the actor after naming", () => {
    const st = game("mosje_ming_natural", { _pendingTargets: { jantje_name: { label: "Kannetje Melk", cardId: "piecie_kannetje_melk" } } });
    const out = effect_jantje_jantje(st, "player_1", { jantjeSlot: 0 });
    onlyViewer(out, "player_1");
  });
  it("Chef's Special: reveals the opponent's Piecies with Ronald on the field, nothing without", () => {
    const withRonald = effect_chefs_special(game("mosje_ronald_chef"), "player_1");
    onlyViewer(withRonald, "player_1");
    expect(getRevealedFor(withRonald, "player_1")[0].cardIds).toEqual(["piecie_kannetje_melk", "piecie_broodje_doner"]);
    const without = effect_chefs_special(game("mosje_ming_natural"), "player_1");
    expect(getRevealedFor(without, "player_1")).toEqual([]);
    expect(getRevealedFor(without, "player_2")).toEqual([]);
  });
  it("Those Eyelashes Tho...: the opponent (hand owner) picks their own discard; Snelle is blocked for them", () => {
    for (const [me, opp] of [["player_1", "player_2"], ["player_2", "player_1"]]) {
      const st = game("mosje_martin_historian");
      st.players[me].activeSlots = [mkSlot({ mp: 40, cardId: "mosje_martin_historian" }), null];
      st.players[opp].hand = [card("piecie_kannetje_melk"), card("piecie_broodje_doner")];
      st.players[opp].graveyard = [];
      const r = effect_those_eyelashes(st, me, { eyeSlot: 0 });
      expect(r.needChoice.playerId).toBe(opp); // the hand's owner chooses
      expect(r.needChoice.options.map((o) => o.cardId)).toEqual(["piecie_kannetje_melk", "piecie_broodje_doner"]); // their own hand
      const answered = JSON.parse(JSON.stringify(r.state));
      answered.players[opp]._pendingTargets = { eyelash_discard: { cardId: "piecie_broodje_doner" } };
      const done = effect_those_eyelashes(answered, me, { eyeSlot: 0 });
      expect(done._snelleBlocked).toBe(opp);
      expect(done.players[opp].graveyard.map((c) => c.cardId)).toContain("piecie_broodje_doner");
      expect(getRevealedFor(done, me)).toEqual([]); // nothing is revealed to anyone
    }
  });
});

describe("the bot only uses what a card reveals", () => {
  it("a peek ability (Ronald) picks from the hand it shows", () => {
    expect(defaultAbilityInputs(game("mosje_ronald_chef"), "player_1", "ability_ronald_chef_strategic_insight")).toEqual({ locked_card: 0 });
  });
  it("with an earlier reveal the bot picks a revealed card", () => {
    const st = revealCards(game("mosje_ronald_chef"), "player_1", "x", ["piecie_broodje_doner"]);
    expect(defaultAbilityInputs(st, "player_1", "ability_ronald_chef_strategic_insight")).toEqual({ locked_card: 1 });
  });
  it("an ability with a hand input but no reveal never reads the opponent hand (it is skipped)", async () => {
    vi.resetModules();
    vi.doMock("../../src/rules/mosjeAbilityRules.js", () => ({ MOSJE_ABILITY_RULES: { ability_test_no_peek: { inputs: [{ key: "c", kind: "oppHandCard" }] } } }));
    try {
      const { defaultAbilityInputs: fresh } = await import("../../src/bot/strategy/defaultAbilityInputs.js");
      const st = game("mosje_ronald_chef");
      Object.defineProperty(st.players.player_2, "hand", { get() { throw new Error("hand was read"); }, configurable: true });
      expect(fresh(st, "player_1", "ability_test_no_peek")).toBeNull();
    } finally { vi.doUnmock("../../src/rules/mosjeAbilityRules.js"); vi.resetModules(); }
  });
});
