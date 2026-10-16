import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";

const COST = PIECIES.find((p: any) => p.id === "piecie_welloe_force").cost;

function mosje(cardId: string, mp: number) {
  return { cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false };
}

function setup(energy: number) {
  const slots: any[] = [null, null, null, null];
  slots[0] = { cardId: "piecie_welloe_force", type: "PIECIE", faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 };
  return makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { energy, hand: [{ cardId: "piecie_pot_of_weed", type: "PIECIE" }], activeSlots: [mosje("mosje_coert", 80), mosje("mosje_jeffrey", 60)], piecieSlots: slots },
      player_2: { activeSlots: [mosje("mosje_binti", 80), null] },
    },
  });
}

describe("Welloe Force spends Energy, not MP", () => {
  it("leaves every own Mosje's MP unchanged, stays (no redirect), discards the hand card and charges the card cost", () => {
    const res = activatePiecie(setup(6), "player_1", 0);
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(80);
    expect(res.state.players.player_1.activeSlots[1].mp).toBe(60);
    const e = res.state.players.player_1.piecieSlots[0];
    expect(e).toMatchObject({ cardId: "piecie_welloe_force", stays: true, staysEnd: "startOfNextTurn" });
    expect(res.state.players.player_1.hand).toHaveLength(0);
    expect(res.state.players.player_1.energy).toBe(6 - COST);
  });

  it("is refused with too little Energy and sets no redirect", () => {
    const res = activatePiecie(setup(COST - 1), "player_1", 0);
    expect(res.success).toBe(false);
    expect(res.state.players.player_1.piecieSlots[0].stays).not.toBe(true);
    expect(res.state.players.player_1.energy).toBe(COST - 1);
  });
});
