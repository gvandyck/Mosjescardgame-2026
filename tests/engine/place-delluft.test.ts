import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module, no type declarations
import { payEnergy } from "../../src/engine/energy/payEnergy.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

// Delluft (Card List 2.0): the first time a player pays Energy on their own turn they pay 1 more.
// A Coert or Binti on their field: no fee. A Cless: 2 more. Te Hard Gaan costs 2.

const mosje = (cardId: string) => ({ cardId, name: cardId, mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const pie = () => ({ cardId: "piecie_te_hard_gaan", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });

function build(mosjeId: string, energy = 3, active = "player_1") {
  return makeEngineState({
    turnNumber: 3,
    activePlayerId: active,
    activePlace: "place_delluft",
    players: {
      player_1: { energy, piecieSlots: [pie(), pie(), null, null], activeSlots: [mosje(mosjeId), null], deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }] },
      player_2: { energy: 5, activeSlots: [mosje("mosje_gandoe_wizard"), null] },
    },
  });
}

describe("place_delluft - parking fee", () => {
  it("first own-turn payment pays 1 more, the second pays normally", () => {
    const first = activatePiecie(build("mosje_gandoe_wizard", 5), "player_1", 0);
    expect(first.success).toBe(true);
    expect(first.state.players.player_1.energy).toBe(2); // 5 - (2 + 1)
    const second = activatePiecie(first.state, "player_1", 1);
    expect(second.state.players.player_1.energy).toBe(0); // 2 - 2
  });

  it("no fee on the opponent's turn", () => {
    const res = payEnergy(build("mosje_gandoe_wizard", 5, "player_2"), "player_1", 2);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(3);
  });

  it.each(["mosje_coert_tech", "mosje_binti"])("no fee with %s on the field", (id) => {
    const res = activatePiecie(build(id, 3), "player_1", 0);
    expect(res.state.players.player_1.energy).toBe(1);
  });

  it("a Cless pays 2 more", () => {
    const res = activatePiecie(build("mosje_cless_teacher", 5), "player_1", 0);
    expect(res.state.players.player_1.energy).toBe(1); // 5 - (2 + 2)
  });

  it("a Coert beats a Cless: no fee", () => {
    const st = build("mosje_cless_teacher", 5);
    st.players.player_1.activeSlots[1] = mosje("mosje_coert_tech");
    expect(activatePiecie(st, "player_1", 0).state.players.player_1.energy).toBe(3);
  });

  it("refuses a payment it can't cover with the fee, paying nothing", () => {
    const res = activatePiecie(build("mosje_gandoe_wizard", 2), "player_1", 0);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.energy).toBe(2);
    expect(res.state.players.player_1.piecieSlots[0].activated).toBe(false);
  });

  it("a 0-cost payment never triggers the fee", () => {
    const free = payEnergy(build("mosje_gandoe_wizard", 3), "player_1", 0);
    expect(free.state.players.player_1.energy).toBe(3);
    const real = payEnergy(free.state, "player_1", 2);
    expect(real.state.players.player_1.energy).toBe(0); // fee still due on the first real payment
  });
});
