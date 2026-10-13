// Ronald, The Master Chef - Strategic Insight (Card List 2.0): "once per turn, pay 2 Energy: look at your opponent's hand
// and choose 1 card. They set it face-down beside their field; it returns to their hand at the end of their next turn."
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility, startTurn, endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName } from "../helpers/quest56.js";

const RONALD = byName(/Ronald, The Master Chef/);
const card = (cardId: string, type = "PIECIE") => ({ cardId, type });

const board = () => makeEngineState({
  turnNumber: 5,
  players: {
    player_1: { energy: 6, activeSlots: [mkSlot({ mp: 50 }, RONALD), null], deck: [card("piecie_affoe")] },
    player_2: { hand: [card("piecie_kannetje_melk"), card("snelle_jensen", "SNELLE_PIECIE")], deck: [card("piecie_affoe")], activeSlots: [mkSlot({ mp: 40 }), null] },
  },
});
const use = (s: any, index: number) => { s._pendingTargets = { locked_card: index }; return useMosjeAbility(s, "player_1", RONALD.id); };

describe("Ronald Chef: Strategic Insight", () => {
  it("pays 2 Energy, no MP; the chosen card leaves the opponent's hand and is set aside", () => {
    const res = use(board(), 1);
    expect(res.success).toBe(true);
    const { player_1: me, player_2: opp } = res.state.players;
    expect(me.energy).toBe(4);
    expect(me.activeSlots[0].mp).toBe(50);
    expect(opp.hand.map((c: any) => c.cardId)).toEqual(["piecie_kannetje_melk"]);
    expect(opp.setAside.map((e: any) => e.card.cardId)).toEqual(["snelle_jensen"]);
  });

  it("the card stays away through the rest of the current turn, then returns at the end of the opponent's NEXT turn", () => {
    let s = use(board(), 0).state;
    s = endTurn(s); // end of Ronald's own turn: nothing comes back
    expect(s.players.player_2.setAside).toHaveLength(1);
    expect(s.players.player_2.hand.map((c: any) => c.cardId)).toEqual(["snelle_jensen"]);
    s = startTurn(s); // the opponent's turn begins; the card is still away
    expect(s.players.player_2.hand.map((c: any) => c.cardId)).not.toContain("piecie_kannetje_melk");
    s = endTurn(s); // end of the opponent's turn: it returns
    expect(s.players.player_2.setAside).toBeUndefined();
    expect(s.players.player_2.hand.map((c: any) => c.cardId)).toContain("piecie_kannetje_melk");
  });

  it("is once per turn, and refused without a legal pick or with an empty opponent hand", () => {
    const first = use(board(), 0);
    const second = use(first.state, 0);
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already used/);
    expect(use(board(), 9).success).toBe(false);
    const empty = board(); empty.players.player_2.hand = [];
    const res = use(empty, 0);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(6);
  });

  it("refused with 1 Energy and changes nothing", () => {
    const s = board(); s.players.player_1.energy = 1;
    const res = use(s, 0);
    expect(res.success).toBe(false);
    expect(res.state.players.player_2.hand).toHaveLength(2);
  });

  it("the V4 lock fields are gone (no _lockedCard, no cooldown)", () => {
    const res = use(board(), 0);
    expect(res.state.players.player_2._lockedCard).toBeUndefined();
    expect(res.state.players.player_1.activeSlots[0].strategicInsightCooldown).toBeUndefined();
  });
});

describe("Ronald Chef ability description", () => {
  it("is the 2.0 Strategic Insight text", () => {
    const desc = MOSJES.find((m: any) => m.id === "mosje_ronald_chef").abilityDescription.toLowerCase();
    expect(desc).toContain("strategic insight");
    expect(desc).toContain("look at your opponent's hand and choose 1 card");
    expect(desc).toContain("face-down");
    expect(desc).toContain("returns to their hand");
  });
});
