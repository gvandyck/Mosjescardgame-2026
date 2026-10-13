// EFX-01 rest C: Tuk The Sims Architect (Perfect Placement) and Martin, The Historian (Time Control + the Cless, The Teacher
// holder text). Ronald Chef, Coert KasteLuck and Senor West have their own files (ronald-chef-lock, coert-kasteluck-morning-luck,
// west-calculated-guess). Card List 2.0 texts are quoted per describe.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility, startTurn, endTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { finishDrawStep } from "../../src/engine/mosje/finishDrawStep.js";
// @ts-expect-error - JS module
import { settleMosjePauses } from "../../src/bot/settleMosjePauses.js";
// @ts-expect-error - JS module
import { defaultAbilityInputs } from "../../src/bot/strategy/defaultAbilityInputs.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName } from "../helpers/quest56.js";

const TUK = byName(/Sims Architect/);
const HISTORIAN = byName(/The Historian/);
const TEACHER = byName(/Cless, The Teacher/);
const cards = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: "X" }));
const ids = (list: any[]) => list.map((c) => c.cardId);

describe("Tuk Architect: Perfect Placement (once per turn, pay 1 Energy: top 5 of your deck, 2 in your hand, the rest on the bottom in any order)", () => {
  const field = (deck = cards("c1", "c2", "c3", "c4", "c5", "c6"), energy = 6) => makeEngineState({
    turnNumber: 5,
    players: { player_1: { energy, deck, activeSlots: [mkSlot({ mp: 30 }, TUK), null] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
  });
  const use = (s: any, targets: any) => { s._pendingTargets = targets; return useMosjeAbility(s, "player_1", TUK.id); };

  it("2 to hand, the other 3 on the bottom in the chosen order, 1 Energy, no MP", () => {
    const res = use(field(), { pick: [1, 3], order: [2, 0, 1] }); // rest = c1 c3 c5 -> c5 c1 c3
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(ids(p.hand)).toEqual(["c2", "c4"]);
    expect(ids(p.deck)).toEqual(["c6", "c5", "c1", "c3"]);
    expect(p.energy).toBe(5);
    expect(p.activeSlots[0].mp).toBe(30);
  });

  it("without an order the rest keep their order", () => {
    expect(ids(use(field(), { pick: [0, 4] }).state.players.player_1.deck)).toEqual(["c6", "c2", "c3", "c4"]);
  });

  it("a deck under 5 cards still works (2 picks of what is there)", () => {
    const res = use(field(cards("c1", "c2", "c3")), { pick: [0, 2] });
    expect(ids(res.state.players.player_1.hand)).toEqual(["c1", "c3"]);
    expect(ids(res.state.players.player_1.deck)).toEqual(["c2"]);
  });

  it("refused (nothing changes, no Energy) for a bad pick, a bad order, no Energy, or a second use", () => {
    for (const bad of [{}, { pick: [1] }, { pick: [1, 1] }, { pick: [1, 7] }, { pick: [0, 1], order: [0, 0, 1] }]) {
      const res = use(field(), bad);
      expect(res.success, JSON.stringify(bad)).toBe(false);
      expect(res.state.players.player_1.energy).toBe(6);
    }
    expect(use(field(undefined, 0), { pick: [0, 1] }).success).toBe(false);
    const first = use(field(), { pick: [0, 1] });
    expect(use(first.state, { pick: [0, 1] }).success).toBe(false);
  });

  it("bot defaults: pick the top 2, keep the order of the other 3 (and size the order after the pick)", () => {
    const s = field();
    expect(defaultAbilityInputs(s, "player_1", "ability_tuk_architect_perfect_placement")).toEqual({ pick: [0, 1], order: [0, 1, 2] });
    const small = field(cards("c1", "c2", "c3"));
    expect(defaultAbilityInputs(small, "player_1", "ability_tuk_architect_perfect_placement")).toEqual({ pick: [0, 1], order: [0] });
    expect(use(small, defaultAbilityInputs(small, "player_1", "ability_tuk_architect_perfect_placement")).success).toBe(true);
  });
});

describe("Martin Historian: Time Control (once per turn, instead of your normal draw, look at the top 5 of any deck, put them back in any order, gain 15 MP; end of turn draw 2)", () => {
  const mine = () => cards("m1", "m2", "m3", "m4", "m5", "m6", "m7");
  const theirs = () => cards("o1", "o2", "o3", "o4", "o5", "o6");
  const turn = (extra: any = {}, slots: any[] = [mkSlot({ mp: 30 }, HISTORIAN), null]) => startTurn(makeEngineState({
    turnNumber: 5,
    players: { player_1: { deck: mine(), activeSlots: slots }, player_2: { deck: theirs(), activeSlots: [mkSlot({ mp: 40 }), null] } },
    ...extra,
  }));

  it("the start of turn pauses at the draw step and offers Time Control", () => {
    const s = turn();
    expect(s.pendingDrawStep.options.map((o: any) => o.mosjeId)).toEqual([HISTORIAN.id]);
    expect(s.players.player_1.hand).toHaveLength(0); // no normal draw yet
  });

  it("using it (own deck): no normal draw, the top 5 reordered, +15 MP", () => {
    const res = finishDrawStep(turn(), "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1", order: [4, 3, 2, 1, 0] } });
    expect(res.ok).toBe(true);
    const p = res.state.players.player_1;
    expect(p.hand).toHaveLength(0);
    expect(ids(p.deck)).toEqual(["m5", "m4", "m3", "m2", "m1", "m6", "m7"]);
    expect(p.activeSlots[0].mp).toBe(45);
  });

  it("the opponent's deck can be reordered too (the nested timeControl form works as well)", () => {
    const res = finishDrawStep(turn(), "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { timeControl: { deckOwner: "player_2", order: [1, 0, 2, 3, 4] } } });
    expect(ids(res.state.players.player_2.deck)).toEqual(["o2", "o1", "o3", "o4", "o5", "o6"]);
    expect(ids(res.state.players.player_1.deck)).toEqual(ids(mine()));
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(45);
  });

  it("the turn ends with a draw of 2 only when Time Control was used", () => {
    const used = finishDrawStep(turn(), "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1" } }).state;
    const after = endTurn(used).players.player_1;
    expect(ids(after.hand)).toEqual(["m1", "m2"]);

    const normal = finishDrawStep(turn(), "player_1", { use: [] }).state;
    expect(ids(normal.players.player_1.hand)).toEqual(["m1"]); // the normal draw happened
    expect(endTurn(normal).players.player_1.hand).toHaveLength(1); // no end-of-turn draw
  });

  it("an end-of-turn draw from an empty deck draws nothing", () => {
    const s = turn({ players: { player_1: { deck: cards("m1") } } });
    const used = finishDrawStep(s, "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_2" } }).state;
    expect(ids(endTurn(used).players.player_1.hand)).toEqual(["m1"]);
  });

  it("a bad order is ignored: the normal draw happens instead", () => {
    const res = finishDrawStep(turn(), "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1", order: [0, 0, 1, 2, 3] } });
    expect(ids(res.state.players.player_1.hand)).toEqual(["m1"]);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it("holder (Cless, The Teacher on the field), own deck: keepCardId puts 1 of the 5 into your hand", () => {
    const s = turn({}, [mkSlot({ mp: 30 }, HISTORIAN), mkSlot({ mp: 30 }, TEACHER)]);
    const res = finishDrawStep(s, "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1", order: [0, 1, 2, 3, 4], keepCardId: "m3" } });
    const p = res.state.players.player_1;
    expect(ids(p.hand)).toEqual(["m3"]);
    expect(ids(p.deck)).toEqual(["m1", "m2", "m4", "m5", "m6", "m7"]);
  });

  it("keepCardId is ignored without the holder text, outside the top 5, or on the opponent's deck", () => {
    const solo = finishDrawStep(turn(), "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1", keepCardId: "m3" } });
    expect(solo.state.players.player_1.hand).toHaveLength(0);
    const s = turn({}, [mkSlot({ mp: 30 }, HISTORIAN), mkSlot({ mp: 30 }, TEACHER)]);
    const far = finishDrawStep(s, "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_1", keepCardId: "m7" } });
    expect(far.state.players.player_1.hand).toHaveLength(0);
    const opp = finishDrawStep(s, "player_1", { use: [HISTORIAN.id], [HISTORIAN.id]: { deck_owner: "player_2", keepCardId: "o2" } });
    expect(opp.state.players.player_1.hand).toHaveLength(0);
    expect(opp.state.players.player_2.deck).toHaveLength(6);
  });

  it("a bot never stalls on the draw step (it draws normally)", () => {
    const { state, waiting } = settleMosjePauses(turn(), []);
    expect(waiting).toBe(false);
    expect(state.pendingDrawStep).toBeUndefined();
    expect(ids(state.players.player_1.hand)).toEqual(["m1"]);
  });

  it("there is no Activate path and no discard retrieval (V4) any more", () => {
    const s = turn();
    delete s.pendingDrawStep;
    s.players.player_1.graveyard = cards("g1");
    const res = useMosjeAbility(s, "player_1", HISTORIAN.id);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.hand).toHaveLength(0);
  });
});
