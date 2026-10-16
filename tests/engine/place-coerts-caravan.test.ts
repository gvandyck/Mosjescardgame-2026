import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

// Coert's Caravan (Card List 2.0): once per turn a player with a Coert on their field activates 1 Piecie for 0 Energy.
// It is used automatically on the first Piecie that costs 1+ Energy. Te Hard Gaan costs 2.

const mosje = (cardId: string) => ({ cardId, name: cardId, mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const pie = () => ({ cardId: "piecie_te_hard_gaan", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });

function build(mosjeId: string, place: string | null = "place_coerts_caravan") {
  return makeEngineState({
    turnNumber: 3,
    activePlace: place,
    players: {
      player_1: { energy: 6, piecieSlots: [pie(), pie(), null, null], activeSlots: [mosje(mosjeId), null], deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }] },
      player_2: { activeSlots: [mosje("mosje_binti"), null] },
    },
  });
}

describe("place_coerts_caravan - free Piecie once per turn", () => {
  it("first Piecie costs 0, the second costs its full 2", () => {
    const first = activatePiecie(build("mosje_coert"), "player_1", 0);
    expect(first.success).toBe(true);
    expect(first.state.players.player_1.energy).toBe(6);
    const second = activatePiecie(first.state, "player_1", 1);
    expect(second.success).toBe(true);
    expect(second.state.players.player_1.energy).toBe(4);
  });

  it("without a Coert on the field the Piecie costs full", () => {
    const res = activatePiecie(build("mosje_binti"), "player_1", 0);
    expect(res.state.players.player_1.energy).toBe(4);
  });

  it("without the Place the Piecie costs full", () => {
    const res = activatePiecie(build("mosje_coert", null), "player_1", 0);
    expect(res.state.players.player_1.energy).toBe(4);
  });

  it("the free use comes back on the next turn", () => {
    const first = activatePiecie(build("mosje_coert"), "player_1", 0);
    const next = JSON.parse(JSON.stringify(first.state));
    next.turnNumber = 5;
    const res = activatePiecie(next, "player_1", 1);
    expect(res.state.players.player_1.energy).toBe(6);
  });
});
