// EFX-01 non-deck Mosjes: Jeffrey, The Strongman (Brute Force), Gandoe, The Destroyer (Elimination Strike),
// Martin, The Precision Driver (Perfect Line + Pit Stop). Card List 2.0 texts are quoted in each describe.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility, activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { activatePiecieFree } from "../../src/engine/table/activatePiecieFree.js";
// @ts-expect-error - JS module
import { piecieActivationGate } from "../../src/engine/table/piecieActivationGate.js";
// @ts-expect-error - JS module
import { resolvePendingChoice } from "../../src/engine/mosje/resolvePendingChoice.js";
// @ts-expect-error - JS module
import { settleMosjePauses } from "../../src/bot/settleMosjePauses.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName, build, finish } from "../helpers/quest56.js";

const JEFF = byName(/Jeffrey, The Strongman/);
const DESTROYER = byName(/The Destroyer/);
const DRIVER = byName(/Precision Driver/);
const placed = (cardId: string) => ({ cardId, type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });

describe("Jeffrey, The Strongman: Brute Force (a Quest win of one of your Mosjes: +10 MP extra; no MP-giving Piecies)", () => {
  it("another own Mosje that wins a Quest gets +10 extra", () => {
    const { s, q } = build("quick_thinking", { p1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, JEFF)] } });
    const win = finish(s, q, true);
    expect(win.players.player_1.activeSlots[0].mp).toBe(30 + q.win + 10);
    expect(win.players.player_1.activeSlots[1].mp).toBe(30);
  });

  it("no bonus on a lost Quest, and none when Jeffrey is not on the field", () => {
    const withJ = build("quick_thinking", { p1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, JEFF)] } });
    const lost = finish(withJ.s, withJ.q, false);
    expect(lost.players.player_1.activeSlots[0].mp).toBeLessThan(30);
    const without = build("quick_thinking");
    expect(finish(without.s, without.q, true).players.player_1.activeSlots[0].mp).toBe(30 + without.q.win);
  });

  const withPiecie = (id: string, jeffrey: boolean) => makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { energy: 6, activeSlots: [mkSlot({ mp: 30 }), jeffrey ? mkSlot({ mp: 30 }, JEFF) : null], piecieSlots: [placed(id), null, null] },
      player_2: { activeSlots: [mkSlot({ mp: 40 }), null] },
    },
  });

  it("Jeffrey on the field: Ronald Kip (gives MP) is refused and Energy stays", () => {
    const res = activatePiecie(withPiecie("piecie_ronald_kip", true), "player_1", 0);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(6);
  });

  it("also refused for a free activation", () => {
    const res = activatePiecieFree(withPiecie("piecie_ronald_kip", true), "player_1", { slotIndex: 0 });
    expect(res.success).toBe(false);
  });

  it("without Jeffrey Ronald Kip works; a Piecie that gives no MP (Te Hard Gaan) is fine with him", () => {
    expect(activatePiecie(withPiecie("piecie_ronald_kip", false), "player_1", 0).success).toBe(true);
    expect(activatePiecie(withPiecie("piecie_te_hard_gaan", true), "player_1", 0).success).toBe(true);
  });

  it("the V4 FOOD/RESTORE tag rule is gone: tags alone no longer block a Piecie", () => {
    const s = withPiecie("x", true);
    expect(piecieActivationGate(s, "player_1", { id: "piecie_not_in_list", tags: ["FOOD", "RESTORE"] })).toBeNull();
  });
});

describe("Gandoe, The Destroyer: Elimination Strike (once per game, 4 Energy: the opponent's lowest-level Mosje to the Welloe pile)", () => {
  const board = (opp: any[], energy = 6) => makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { energy, activeSlots: [mkSlot({ mp: 30 }, DESTROYER), null] },
      player_2: { activeSlots: opp },
    },
  });

  it("lowest level (L1 beside an L2) goes to the Welloe pile and 4 Energy is paid", () => {
    const res = useMosjeAbility(board([mkSlot({ mp: 40, level: 2 }), mkSlot({ mp: 40 })]), "player_1", DESTROYER.id);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(2);
    expect(res.state.players.player_2.welloePile.length).toBe(1);
    expect(res.state.players.player_2.activeSlots[1]?.isDefeated ?? true).toBe(true);
    expect(res.state.players.player_2.activeSlots[0].isDefeated).toBeFalsy();
  });

  it("two L1 Mosjes: the owner gets a pendingChoice and the picked one goes", () => {
    const res = useMosjeAbility(board([mkSlot({ mp: 40 }), mkSlot({ mp: 40 })]), "player_1", DESTROYER.id);
    expect(res.success).toBe(true);
    const pc = res.state.pendingChoice;
    expect(pc.playerId).toBe("player_1");
    expect(pc.options.length).toBe(2);
    const done = resolvePendingChoice(res.state, pc.options[1]);
    expect(done.ok).toBe(true);
    expect(done.state.players.player_2.welloePile.length).toBe(1);
    expect(done.state.players.player_2.activeSlots[0].isDefeated).toBeFalsy();
  });

  it("a bot owner's tie settles without stalling", () => {
    const res = useMosjeAbility(board([mkSlot({ mp: 40 }), mkSlot({ mp: 40 })]), "player_1", DESTROYER.id);
    const settled = settleMosjePauses(res.state, []);
    expect(settled.state.pendingChoice).toBeUndefined();
    expect(settled.state.players.player_2.welloePile.length).toBe(1);
  });

  it("the only lowest-level Mosje is fresh: the lowest-level non-fresh one is taken", () => {
    const res = useMosjeAbility(board([mkSlot({ mp: 40, level: 2 }), mkSlot({ mp: 40, level: 1, entryProtected: true })]), "player_1", DESTROYER.id);
    expect(res.success).toBe(true);
    expect(res.state.players.player_2.welloePile.length).toBe(1);
    expect(res.state.players.player_2.activeSlots[1].isDefeated).toBeFalsy();
    expect(res.state.players.player_2.activeSlots[0]?.isDefeated ?? true).toBe(true);
  });

  it("every opponent Mosje fresh: refused, nothing paid", () => {
    const res = useMosjeAbility(board([mkSlot({ mp: 40, entryProtected: true }), null]), "player_1", DESTROYER.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(6);
  });

  it("a second use in the same game is refused", () => {
    const first = useMosjeAbility(board([mkSlot({ mp: 40 }), mkSlot({ mp: 40, level: 2 })], 10), "player_1", DESTROYER.id);
    expect(first.success).toBe(true);
    const next = first.state;
    next.players.player_1.activeSlots[0].abilityUsesThisTurn = 0; // a new turn
    next.players.player_1.activeSlots[0].abilityUsedThisTurn = false;
    const again = useMosjeAbility(next, "player_1", DESTROYER.id);
    expect(again.success).toBe(false);
    expect(again.error).toBe("Ability already used this game");
  });

  it("refused with less than 4 Energy", () => {
    expect(useMosjeAbility(board([mkSlot({ mp: 40 }), null], 3), "player_1", DESTROYER.id).success).toBe(false);
  });
});

describe("Martin, The Precision Driver: Perfect Line (+15 MP extra on his Quest wins) and Pit Stop (1 Energy + discard 2: draw 3, gain 10)", () => {
  it("Perfect Line: his own Quest win gives +15 extra; a different Mosje's win does not", () => {
    const own = build("quick_thinking", { me: mkSlot({ mp: 30 }, DRIVER) });
    expect(finish(own.s, own.q, true).players.player_1.activeSlots[0].mp).toBe(30 + own.q.win + 15);
    const other = build("quick_thinking", { p1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, DRIVER)] } });
    expect(finish(other.s, other.q, true).players.player_1.activeSlots[0].mp).toBe(30 + other.q.win);
  });

  const board = (hand: string[]) => makeEngineState({
    turnNumber: 3,
    players: {
      player_1: {
        energy: 3,
        hand: hand.map(cardId => ({ cardId, type: "PIECIE" })),
        deck: ["d1", "d2", "d3", "d4"].map(cardId => ({ cardId })),
        activeSlots: [mkSlot({ mp: 20 }, DRIVER), null],
      },
      player_2: { activeSlots: [mkSlot({ mp: 40 }), null] },
    },
  });

  it("Pit Stop: discard 2, draw 3, +10 MP, 1 Energy", () => {
    const s = board(["a", "b", "c"]);
    s._pendingTargets = { discard_cards: ["a", "b"] };
    const res = useMosjeAbility(s, "player_1", DRIVER.id);
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.hand.map((c: any) => c.cardId)).toEqual(["c", "d1", "d2", "d3"]);
    expect(p.graveyard.length).toBe(2);
    expect(p.activeSlots[0].mp).toBe(30);
    expect(p.energy).toBe(2);
  });

  it("Pit Stop with fewer than 2 cards in hand is refused and pays nothing", () => {
    const s = board(["a"]);
    s._pendingTargets = { discard_cards: [0] };
    const res = useMosjeAbility(s, "player_1", DRIVER.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(3);
    expect(res.state.players.player_1.hand.length).toBe(1);
  });
});
