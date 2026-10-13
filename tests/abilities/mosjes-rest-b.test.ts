// EFX-01 rest B: Ming The Natural (Lucky Draw), Ming The Predictor (Future Sight), Jeffrey The Silent Gambler (High
// Stakes), Youri (Speed Activate) and Ronald The Mastermind (Master Plan). Card List 2.0 texts are quoted per describe.
import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module
import { useMosjeAbility, activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName, build, finish } from "../helpers/quest56.js";

const NATURAL = byName(/Ming, The Natural/);
const PREDICTOR = byName(/Ming, The Predictor/);
const GAMBLER = byName(/Silent Gambler/);
const YOURI = byName(/Youri/);
const MASTERMIND = byName(/The Mastermind/);
const STRONGMAN = byName(/Jeffrey, The Strongman/);

const field = (me: any, p1: any = {}, extra: any = {}) => makeEngineState({
  turnNumber: 5,
  ...extra,
  players: { player_1: { energy: 6, activeSlots: [mkSlot({ mp: 30 }, me), null], ...p1 }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
});
const use = (s: any, me: any, targets: any) => { s._pendingTargets = targets; return useMosjeAbility(s, "player_1", me.id); };
const card = (cardId: string) => ({ cardId, type: "X" });

afterEach(() => vi.restoreAllMocks());

describe("Ming, The Natural: Lucky Draw (reveal the top card; a Piecie: activate it free or add it to hand; else draw it and gain 15 MP)", () => {
  const withTop = (top: string) => field(NATURAL, { deck: [card(top), card("snelle_jensen")] });

  it("a Piecie, choice activate: resolves free (no Energy), card to the discard pile, none in hand", () => {
    const res = use(withTop("piecie_ronald_kip"), NATURAL, { choice: "activate" });
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.energy).toBe(6);
    expect(p.activeSlots[0].mp).toBe(80); // Ronald Kip +50
    expect(p.graveyard.some((c: any) => c.cardId === "piecie_ronald_kip")).toBe(true);
    expect(p.hand).toHaveLength(0);
    expect(p.deck).toHaveLength(1);
  });

  it("a Piecie, choice hand: added to hand, nothing activated, no MP", () => {
    const res = use(withTop("piecie_ronald_kip"), NATURAL, { choice: "hand" });
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.hand.map((c: any) => c.cardId)).toEqual(["piecie_ronald_kip"]);
    expect(p.activeSlots[0].mp).toBe(30);
  });

  it("a Piecie without a choice is refused and nothing changes", () => {
    const res = use(withTop("piecie_ronald_kip"), NATURAL, {});
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.deck).toHaveLength(2);
  });

  it("anything else (a Snelle): drawn to hand and Ming gains 15", () => {
    const res = use(withTop("snelle_jensen"), NATURAL, {});
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.hand.map((c: any) => c.cardId)).toEqual(["snelle_jensen"]);
    expect(p.activeSlots[0].mp).toBe(45);
  });

  it("empty deck: nothing happens and the ability still counts as used", () => {
    const res = use(field(NATURAL, { deck: [] }), NATURAL, {});
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.hand).toHaveLength(0);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it("a free activation the rules refuse (Jeffrey, The Strongman: no MP Piecies) is refused whole", () => {
    const s = field(NATURAL, { deck: [card("piecie_ronald_kip")] });
    s.players.player_1.activeSlots[1] = mkSlot({ mp: 30 }, STRONGMAN);
    const res = use(s, NATURAL, { choice: "activate" });
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.deck).toHaveLength(1);
  });
});

describe("Ming, The Predictor: Future Sight (look at the top card of one Quest stack; you may pay 1 Energy to put it on the bottom)", () => {
  const stacks = () => ({
    FIGHTING: { deck: ["q1", "q2", "q3"], faceUp: null, tokens: 0, discard: [] },
    DIGITAL: { deck: ["d1", "d2"], faceUp: null, tokens: 0, discard: [] },
    ARTISTIC: { deck: [], faceUp: null, tokens: 0, discard: [] },
  });
  const board = (energy: number) => field(PREDICTOR, { energy }, { questStacks: stacks() });

  it("pay yes with 1 Energy: the chosen stack's top goes to the bottom and 1 Energy is paid", () => {
    const res = use(board(3), PREDICTOR, { stack_id: "DIGITAL", bottom: true });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.DIGITAL.deck).toEqual(["d2", "d1"]);
    expect(res.state.questStacks.FIGHTING.deck).toEqual(["q1", "q2", "q3"]);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("pay yes with 0 Energy: the card stays, no error, nothing paid", () => {
    const res = use(board(0), PREDICTOR, { stack_id: "DIGITAL", bottom: true });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.DIGITAL.deck).toEqual(["d1", "d2"]);
    expect(res.state.players.player_1.energy).toBe(0);
  });

  it("look only (no): the card stays and no Energy is paid", () => {
    const res = use(board(3), PREDICTOR, { stack_id: "FIGHTING", bottom: false });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.FIGHTING.deck).toEqual(["q1", "q2", "q3"]);
    expect(res.state.players.player_1.energy).toBe(3);
  });

  it("an empty stack, a missing stack or an unknown stack is refused", () => {
    for (const stack_id of ["ARTISTIC", undefined, "NOPE"]) {
      const res = use(board(3), PREDICTOR, { stack_id, bottom: true });
      expect(res.success).toBe(false);
      expect(res.state.players.player_1.energy).toBe(3);
    }
  });
});

describe("Jeffrey, The Silent Gambler: High Stakes (stake 1 or 2 Energy, roll: 1-2 lost; 3-4 back; 5-6 back + draw 1 + 10 MP per Energy + next Quest success +15)", () => {
  const roll = (n: number) => vi.spyOn(Math, "random").mockReturnValue((n - 0.5) / 6);
  const board = (energy = 3) => field(GAMBLER, { energy, deck: [card("snelle_jensen")] });

  it("roll 1 with a stake of 2: the Energy is lost (3 -> 1)", () => {
    roll(1);
    const res = use(board(), GAMBLER, { stake: 2 });
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(1);
  });

  it("roll 3: the Energy comes back (3 -> 3), nothing else", () => {
    roll(3);
    const res = use(board(), GAMBLER, { stake: 2 });
    const p = res.state.players.player_1;
    expect(p.energy).toBe(3);
    expect(p.hand).toHaveLength(0);
    expect(p.activeSlots[0].mp).toBe(30);
  });

  it("roll 6 with a stake of 2: Energy back, draw 1, +20 MP, and the next Quest success this turn gets +15 extra once", () => {
    roll(6);
    const res = use(board(), GAMBLER, { stake: 2 });
    const p = res.state.players.player_1;
    expect(p.energy).toBe(3);
    expect(p.hand.map((c: any) => c.cardId)).toEqual(["snelle_jensen"]);
    expect(p.activeSlots[0].mp).toBe(50);
    expect(p.gamblerQuestBonusTurn).toBe(res.state.turnNumber);
  });

  it("a stake the player cannot pay (2 with 1 Energy) is refused and nothing is lost", () => {
    roll(1);
    const res = use(board(1), GAMBLER, { stake: 2 });
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(1);
  });

  it("only 1 or 2 may be staked", () => {
    for (const stake of [0, 3, undefined]) expect(use(board(), GAMBLER, { stake }).success).toBe(false);
  });

  it("the +15 on a Quest success is paid once, to the Mosje that succeeded, and only on the armed turn", () => {
    const { s, q } = build("quick_thinking", { p1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, GAMBLER)] } });
    s.players.player_1.gamblerQuestBonusTurn = s.turnNumber;
    const win = finish(s, q, true);
    expect(win.players.player_1.activeSlots[0].mp).toBe(30 + q.win + 15);
    expect(win.players.player_1.gamblerQuestBonusTurn).toBeUndefined();
    const stale = build("quick_thinking", { p1: { activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, GAMBLER)] } });
    stale.s.players.player_1.gamblerQuestBonusTurn = stale.s.turnNumber - 1;
    expect(finish(stale.s, stale.q, true).players.player_1.activeSlots[0].mp).toBe(30 + stale.q.win);
  });
});

describe("Youri, The Speedrunner: Speed Activate (pay 1 Energy: a Piecie placed this turn may be activated now - its own cost still paid - then draw 1)", () => {
  const placed = (extra: any = {}) => ({ cardId: "piecie_te_hard_gaan", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 5, canActivateOnTurn: 6, ...extra });
  const board = (slot: any) => field(YOURI, { piecieSlots: [slot, null, null], deck: [card("snelle_jensen")] });

  it("makes the slot ready now, draws 1, costs 1 Energy; activating it then still pays its own cost", () => {
    const res = use(board(placed()), YOURI, { piecie_slot: 0 });
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.energy).toBe(5);
    expect(p.piecieSlots[0].canActivateOnTurn).toBe(5);
    expect(p.hand).toHaveLength(1);
    const act = activatePiecie(res.state, "player_1", 0);
    expect(act.success).toBe(true);
    expect(act.state.players.player_1.energy).toBe(3); // Te Hard Gaan costs 2
  });

  it("no per-game cap: usable again every turn", () => {
    const s = board(placed());
    s.players.player_1.youriAbilityUses = 99;
    expect(use(s, YOURI, { piecie_slot: 0 }).success).toBe(true);
  });

  it("refused (nothing paid) for a Piecie placed on an earlier turn, an already ready one, or no choice", () => {
    for (const slot of [placed({ playedOnTurn: 3, canActivateOnTurn: 4 }), placed({ canActivateOnTurn: 5 })]) {
      const res = use(board(slot), YOURI, { piecie_slot: 0 });
      expect(res.success).toBe(false);
      expect(res.state.players.player_1.energy).toBe(6);
    }
    expect(use(board(placed()), YOURI, {}).success).toBe(false);
  });

  it("refused with 0 Energy", () => {
    const s = board(placed());
    s.players.player_1.energy = 0;
    expect(use(s, YOURI, { piecie_slot: 0 }).success).toBe(false);
  });
});

describe("Ronald, The Mastermind: Master Plan (once per turn, pay 2 Energy: activate a Piecie from your discard pile as if ready; it goes back to the discard pile)", () => {
  const board = (graveyard: any[], extra: any = {}) => field(MASTERMIND, { graveyard, ...extra });

  it("Kannetje Melk from the discard pile: 2 Energy paid, effect resolves, the card is back in the discard pile", () => {
    const res = use(board([{ cardId: "piecie_kannetje_melk" }]), MASTERMIND, { discard_card: 0 });
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.energy).toBe(4);
    expect(p.activeSlots[0].mp).toBe(55); // +25
    expect(p.graveyard.filter((c: any) => c.cardId === "piecie_kannetje_melk")).toHaveLength(1);
    expect(p.piecieSlots.every((s: any) => s === null)).toBe(true);
  });

  it("once per turn, no once-per-game flag: a second use the same turn is refused, the next turn works", () => {
    const first = use(board([{ cardId: "piecie_kannetje_melk" }]), MASTERMIND, { discard_card: 0 });
    first.state._pendingTargets = { discard_card: 0 };
    const again = useMosjeAbility(first.state, "player_1", MASTERMIND.id);
    expect(again.success).toBe(false);
    const next = JSON.parse(JSON.stringify(first.state));
    const slot = next.players.player_1.activeSlots[0];
    slot.abilityUsedThisTurn = false; slot.abilityUsesThisTurn = 0;
    next._pendingTargets = { discard_card: 0 };
    expect(useMosjeAbility(next, "player_1", MASTERMIND.id).success).toBe(true);
    expect(slot.abilityUsedThisGame).toBeFalsy();
  });

  it("Jeffrey, The Strongman on the field + an MP Piecie: refused, nothing paid, the card stays in the discard pile", () => {
    const s = board([{ cardId: "piecie_ronald_kip" }]);
    s.players.player_1.activeSlots[1] = mkSlot({ mp: 30 }, STRONGMAN);
    const res = use(s, MASTERMIND, { discard_card: 0 });
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(6);
    expect(res.state.players.player_1.graveyard).toHaveLength(1);
  });

  it("refused for a card that is not a Piecie, for no choice, and with 1 Energy", () => {
    expect(use(board([{ cardId: "snelle_jensen" }]), MASTERMIND, { discard_card: 0 }).success).toBe(false);
    expect(use(board([{ cardId: "piecie_kannetje_melk" }]), MASTERMIND, {}).success).toBe(false);
    expect(use(board([{ cardId: "piecie_kannetje_melk" }], { energy: 1 }), MASTERMIND, { discard_card: 0 }).success).toBe(false);
  });
});
