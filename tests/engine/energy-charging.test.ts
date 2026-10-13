import { describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { activatePiecie, playSnellie, playPlace, useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

function mosje(cardId: string, mp = 80) {
  return { cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false };
}
function slotOf(cardId: string, type: string, extra: any = {}) {
  return { cardId, type, faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1, ...extra };
}
function build(energy: number, piecieSlots: any[] = [null, null, null, null], hand: any[] = [], extra: any = {}) {
  return makeEngineState({
    turnNumber: 3,
    ...extra,
    players: {
      player_1: { energy, hand, piecieSlots, activeSlots: [mosje("mosje_coert"), null], deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }] },
      player_2: { activeSlots: [mosje("mosje_binti"), null] },
    },
  });
}
const pieSlots = (cardId: string) => [slotOf(cardId, "PIECIE"), null, null, null];

describe("Energy charging", () => {
  it("refuses a Piecie (cost 2) with 1 Energy and changes nothing", () => {
    const s = build(1, pieSlots("piecie_te_hard_gaan"));
    const res = activatePiecie(s, "player_1", 0);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Not enough Energy");
    expect(res.state.players.player_1.energy).toBe(1);
    expect(res.state.players.player_1.piecieSlots[0].activated).toBe(false);
    expect(res.state.players.player_1.piecieSlots[0].faceDown).toBe(true);
  });

  it("charges a Piecie its cost with enough Energy", () => {
    const res = activatePiecie(build(6, pieSlots("piecie_te_hard_gaan")), "player_1", 0);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(4);
  });

  it("activates a cost-0 Piecie with 0 Energy", () => {
    const res = activatePiecie(build(0, pieSlots("piecie_kannetje_melk")), "player_1", 0);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(0);
  });

  it("refuses a Snelle (cost 2) with 1 Energy; card stays in hand", () => {
    const hand = [{ cardId: "snelle_counter_strikka", type: "SNELLE_PIECIE" }];
    const def = { name: "Counter Strikka", effectId: "effect_snelle_counter_strikka", cost: 2 };
    const res = playSnellie(build(1, undefined, hand), "player_1", hand[0], def);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(1);
    expect(res.state.players.player_1.hand).toHaveLength(1);
  });

  it("charges a Snelle its cost and removes it from hand", () => {
    const hand = [{ cardId: "snelle_counter_strikka", type: "SNELLE_PIECIE" }];
    const def = { name: "Counter Strikka", effectId: "effect_snelle_counter_strikka", cost: 2 };
    const res = playSnellie(build(2, undefined, hand), "player_1", hand[0], def);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(0);
    expect(res.state.players.player_1.hand).toHaveLength(0);
  });

  const placeHand = [{ cardId: "place_bank_chilling", type: "PLACE" }];
  const placeDef = { name: "Bank Chilling", cost: 2 };
  it("refuses playing a Place (cost 2) with 1 Energy; Place stays in hand", () => {
    const res = playPlace(build(1, undefined, placeHand), "player_1", placeHand[0], placeDef);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.hand).toHaveLength(1);
    expect(res.state.activePlace).toBeNull();
  });

  it("charges a Place its cost when it is played from hand", () => {
    const res = playPlace(build(3, undefined, placeHand), "player_1", placeHand[0], placeDef);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(1);
    expect(res.state.activePlace).toBe("place_bank_chilling");
  });

  it("a Chris DDR free chain charges only the activated Piecie", () => {
    // The chain activates a second READY Piecie on the field (2.0); that one must cost no Energy.
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const s = build(6, [slotOf("piecie_te_hard_gaan", "PIECIE"), slotOf("piecie_te_hard_gaan", "PIECIE"), null, null]);
    s.players.player_1.activeSlots[0] = mosje("mosje_chris_ddr");
    const res = activatePiecie(s, "player_1", 0);
    vi.restoreAllMocks();
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.piecieSlots[1]).toBeNull(); // chain fired on slot 1
    expect(res.state.players.player_1.energy).toBe(4);
  });
});

describe("Ability Energy charging", () => {
  const withMosje = (energy: number, id: string, extra: any = {}, mp = 60) => {
    const s = build(energy, [null, null, null, null], [], extra);
    s.players.player_1.activeSlots[0] = mosje(id, mp);
    return s;
  };

  it("refuses Tuk Healer (cost 1) with 0 Energy and changes nothing", () => {
    const res = useMosjeAbility(withMosje(0, "mosje_tuk_healer"), "player_1", "mosje_tuk_healer");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Not enough Energy");
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(60);
    expect(res.state.players.player_1.activeSlots[0].abilityUsedThisTurn).toBe(false);
  });

  it("charges Tuk Healer 1 Energy on success", () => {
    const res = useMosjeAbility(withMosje(3, "mosje_tuk_healer"), "player_1", "mosje_tuk_healer");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("a throwing ability (needs UI input) costs no Energy", () => {
    const res = useMosjeAbility(withMosje(6, "mosje_ronald_chef"), "player_1", "mosje_ronald_chef");
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(6);
  });

  it("Ronald Strategic Insight costs 2 Energy and no MP", () => {
    const s = withMosje(6, "mosje_ronald_chef");
    s._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };
    const res = useMosjeAbility(s, "player_1", "mosje_ronald_chef");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(60);
    expect(res.state.players.player_1.energy).toBe(4);
  });

  it("Youri Speed Activate costs exactly 1 Energy and no MP", () => {
    const s = withMosje(6, "mosje_youri");
    s.players.player_1.piecieSlots = [slotOf("piecie_kannetje_melk", "PIECIE", { playedOnTurn: 3, canActivateOnTurn: 4 }), null, null, null];
    s._pendingTargets = { piecie_slot: 0 }; // Speed Activate: a Piecie placed this turn
    const res = useMosjeAbility(s, "player_1", "mosje_youri");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(60);
    expect(res.state.players.player_1.energy).toBe(5);
  });

  it("Gandoe Destroyer Elimination Strike costs 4 Energy and no MP", () => {
    const s = withMosje(6, "mosje_gandoe_destroyer");
    const res = useMosjeAbility(s, "player_1", "mosje_gandoe_destroyer");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(60);
    expect(res.state.players.player_1.energy).toBe(2);
  });

  it("an ability without a cost leaves Energy unchanged", () => {
    const res = useMosjeAbility(withMosje(3, "mosje_ming_predictor"), "player_1", "mosje_ming_predictor");
    expect(res.state.players.player_1.energy).toBe(3);
  });
});
