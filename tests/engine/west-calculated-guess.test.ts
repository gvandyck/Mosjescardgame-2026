// Martin, Senor West - Calculated Guess (Card List 2.0): "once per turn: name a card type (Mosje, Piecie, Snelle or Place),
// then reveal the top card of any deck and put it back. Correct: draw 2 cards and gain 10 MP. Wrong: lose 10 MP."
// Holder (While AZN Cless is also on your field): once per turn look at the top card of a Quest stack before attempting.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { senorWestPeekQuestStack } from "../../src/abilities/mosje/senorWestPeekQuestStack.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName } from "../helpers/quest56.js";

const WEST = byName(/Senor West/);
const AZN = byName(/AZN Cless/);
const card = (cardId: string) => ({ cardId, type: "X" });
const MOSJE_C = "mosje_ronald_chef", PIECIE_C = "piecie_kannetje_melk", SNELLE_C = "snelle_jensen", PLACE_C = "place_synergy_chamber";

const board = (mp = 30, level = 1, mine: any[] = [card(PIECIE_C), card(MOSJE_C), card(SNELLE_C)], theirs: any[] = [card(PLACE_C), card(PIECIE_C)]) => makeEngineState({
  turnNumber: 5,
  players: { player_1: { energy: 6, deck: mine, activeSlots: [mkSlot({ mp, level }, WEST), null] }, player_2: { deck: theirs, activeSlots: [mkSlot({ mp: 40 }), null] } },
});
const guess = (s: any, card_type: string, deck_owner = "player_1") => { s._pendingTargets = { card_type, deck_owner }; return useMosjeAbility(s, "player_1", WEST.id); };

describe("Senor West: Calculated Guess", () => {
  it("correct (own deck, Piecie): draws 2, gains 10, free of Energy", () => {
    const res = guess(board(), "Piecie");
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.activeSlots[0].mp).toBe(40);
    expect(p.hand.map((c: any) => c.cardId)).toEqual([PIECIE_C, MOSJE_C]);
    expect(p.energy).toBe(6);
  });

  it.each([["Mosje", MOSJE_C], ["Snelle", SNELLE_C], ["Place", PLACE_C]])("names %s correctly", (type, top) => {
    const res = guess(board(30, 1, [card(top), card(PIECIE_C), card(PIECIE_C)]), type);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(40);
  });

  it("works on the opponent's deck (which is left untouched)", () => {
    const res = guess(board(), "Place", "player_2");
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(40);
    expect(res.state.players.player_2.deck.map((c: any) => c.cardId)).toEqual([PLACE_C, PIECIE_C]);
  });

  it("wrong: loses 10, draws nothing, the revealed card stays on top", () => {
    const p = guess(board(), "Mosje").state.players.player_1;
    expect(p.activeSlots[0].mp).toBe(20);
    expect(p.hand).toHaveLength(0);
    expect(p.deck[0].cardId).toBe(PIECIE_C);
  });

  it("wrong at 5 MP floors at 0 and stays Level 1 (a loss never goes below 0)", () => {
    const slot = guess(board(5), "Mosje").state.players.player_1.activeSlots[0];
    expect(slot.mp).toBe(0);
    expect(slot.level).toBe(1);
  });

  it("wrong at 0 MP, Level 2 drops back a level (loss funnel)", () => {
    expect(guess(board(0, 2), "Mosje").state.players.player_1.activeSlots[0].level).toBe(1);
  });

  it("'Quest' (and any other word) is not a valid guess: refused, nothing changes", () => {
    for (const bad of ["Quest", "QUEST", "banana"]) {
      const res = guess(board(), bad);
      expect(res.success).toBe(false);
      expect(res.state.players.player_1.activeSlots[0].mp).toBe(30);
    }
  });

  it("a missing guess is refused; an empty deck does nothing but still counts as the use", () => {
    const s = board(); s._pendingTargets = {};
    expect(useMosjeAbility(s, "player_1", WEST.id).success).toBe(false);
    const res = guess(board(30, 1, []), "Piecie");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(30);
    expect(guess(res.state, "Piecie").success).toBe(false); // once per turn
  });
});

describe("Senor West holder text: look at the top of a Quest stack", () => {
  const withAzn = () => {
    const s = board();
    s.players.player_1.activeSlots[1] = mkSlot({ mp: 30 }, AZN);
    s.questStacks = { FIGHTING: { deck: ["quest_tough_it_out", "quest_filler"], faceUp: "quest_filler", tokens: 0, discard: [] } };
    return s;
  };

  it("with AZN Cless: returns the top deck card id, once per turn, no other change", () => {
    const s = withAzn();
    const res = senorWestPeekQuestStack(s, "player_1", "FIGHTING");
    expect(res.success).toBe(true);
    expect(res.cardId).toBe("quest_tough_it_out");
    expect(res.state.questStacks).toEqual(s.questStacks);
    expect(senorWestPeekQuestStack(res.state, "player_1", "FIGHTING").success).toBe(false);
  });

  it("without AZN Cless, on the opponent's turn, or for an unknown stack: refused", () => {
    expect(senorWestPeekQuestStack(board(), "player_1", "FIGHTING").success).toBe(false);
    const s = withAzn();
    expect(senorWestPeekQuestStack(s, "player_1", "NOPE").success).toBe(false);
    s.activePlayerId = "player_2";
    expect(senorWestPeekQuestStack(s, "player_1", "FIGHTING").success).toBe(false);
  });
});
