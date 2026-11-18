// EFX-01 rest B: Ming The Predictor (Future Sight), Youri (Speed Activate) and (moved to starter-creative-mosjes-a) Ronald Dr. Phill-osoof. Card List 2.0 texts are quoted per describe.
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
const STRONGMAN = byName(/Jeffrey, The Strongman/);

const field = (me: any, p1: any = {}, extra: any = {}) => makeEngineState({
  turnNumber: 5,
  ...extra,
  players: { player_1: { energy: 6, activeSlots: [mkSlot({ mp: 30 }, me), null], ...p1 }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
});
const use = (s: any, me: any, targets: any) => { s._pendingTargets = targets; return useMosjeAbility(s, "player_1", me.id); };
const card = (cardId: string) => ({ cardId, type: "X" });

afterEach(() => vi.restoreAllMocks());

// Ming, The Natural (Lucky Draw), Jeffrey, The Silent Gambler (High Stakes) and DJ 80/20: tests/abilities/starter-creative-mosjes-b.test.ts

describe("Ming, The Predictor: Future Sight (look at the top card of one Quest stack; you may pay 1 Energy to put it on the bottom)", () => {
  const stacks = () => ({
    PHYSICAL: { deck: ["q1", "q2", "q3"], faceUp: null, tokens: 0, discard: [] },
    DIGITAL: { deck: ["d1", "d2"], faceUp: null, tokens: 0, discard: [] },
    CREATIVE: { deck: [], faceUp: null, tokens: 0, discard: [] },
  });
  const board = (energy: number) => field(PREDICTOR, { energy }, { questStacks: stacks() });

  it("pay yes with 1 Energy: the chosen stack's top goes to the bottom and 1 Energy is paid", () => {
    const res = use(board(3), PREDICTOR, { stack_id: "DIGITAL", bottom: true });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.DIGITAL.deck).toEqual(["d2", "d1"]);
    expect(res.state.questStacks.PHYSICAL.deck).toEqual(["q1", "q2", "q3"]);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("pay yes with 0 Energy: the card stays, no error, nothing paid", () => {
    const res = use(board(0), PREDICTOR, { stack_id: "DIGITAL", bottom: true });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.DIGITAL.deck).toEqual(["d1", "d2"]);
    expect(res.state.players.player_1.energy).toBe(0);
  });

  it("look only (no): the card stays and no Energy is paid", () => {
    const res = use(board(3), PREDICTOR, { stack_id: "PHYSICAL", bottom: false });
    expect(res.success).toBe(true);
    expect(res.state.questStacks.PHYSICAL.deck).toEqual(["q1", "q2", "q3"]);
    expect(res.state.players.player_1.energy).toBe(3);
  });

  it("an empty stack, a missing stack or an unknown stack is refused", () => {
    for (const stack_id of ["CREATIVE", undefined, "NOPE"]) {
      const res = use(board(3), PREDICTOR, { stack_id, bottom: true });
      expect(res.success).toBe(false);
      expect(res.state.players.player_1.energy).toBe(3);
    }
  });
});

describe("Youri, The Speedrunner: Speed Activate (pay 1 Energy: a Piecie placed this turn may be activated now - its own cost still paid; from Level 2 then draw 1)", () => {
  const placed = (extra: any = {}) => ({ cardId: "piecie_te_hard_gaan", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 5, canActivateOnTurn: 6, ...extra });
  const board = (slot: any) => field(YOURI, { piecieSlots: [slot, null, null], deck: [card("snelle_jensen")] });

  it("makes the slot ready now, draws nothing at Level 1, costs 1 Energy; activating it then still pays its own cost", () => {
    const res = use(board(placed()), YOURI, { piecie_slot: 0 });
    expect(res.success).toBe(true);
    const p = res.state.players.player_1;
    expect(p.energy).toBe(5);
    expect(p.piecieSlots[0].canActivateOnTurn).toBe(5);
    expect(p.hand).toHaveLength(0); // the draw is from Level 2 (71-12, pinned in starter-digital-mosjes-a.test.ts)
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

// Ronald, Dr. Phill-osoof (Master Plan: pay 1 Energy, mark an opponent Mosje for 1 die less): tests/abilities/starter-creative-mosjes-a.test.ts
